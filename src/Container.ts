import {Reflect} from "@dx/reflect";
import {lifestyleMismatch} from "./diagnostics/LifestyleMismatch.ts";
import type { DiagnosticRule } from "./diagnostics/DiagnosticRule.ts";
import {UnregisteredDependencies} from "./diagnostics/UnregisteredDependencies.ts";
import { DisposableTransientComponents } from "./diagnostics/DisposableTransientComponents.ts";
import {ShortCircuitedDependencies} from "./diagnostics/ShortCircuitedDependencies.ts";
import { TornLifestyles } from "./diagnostics/TornLifestyles.ts";
import { AmbiguousLifestyles } from "./diagnostics/AmbiguousLifestyles.ts";
import { VerificationError } from "./diagnostics/VerificationError.ts";


// deno-lint-ignore no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

export const metadata_contacts_key = "di:metadata:contacts";
export const LifeStyles = {
    Singleton: 'Singleton',
    Transient: 'Transient',
    Scoped: 'Scoped'
} as const ;

export type LifeStyleType = (typeof LifeStyles)[keyof typeof LifeStyles];

export interface Registration<T> {
    implementation: Constructor<T>;
    lifestyle: LifeStyleType;
    instance?: T;
}

export class Container {
    private diagnostics: DiagnosticRule[] = [];

    constructor() {
        this.diagnostics.push(new lifestyleMismatch(this.registrations));
        this.diagnostics.push(new ShortCircuitedDependencies(this.registrations));
        this.diagnostics.push(new TornLifestyles(this.registrations, (ctor) => this.createInstance(ctor)));
        this.diagnostics.push(new AmbiguousLifestyles(this.registrations));
        this.diagnostics.push(new DisposableTransientComponents(this.registrations));
        this.diagnostics.push(new UnregisteredDependencies(this.registrations));
    }

    Verify() {
        const diagnosticRulesWithWarnings: DiagnosticRule[] = [];

        for (const rule of this.diagnostics) {
            rule.Verify();
            if (rule.warnings.length > 0) {
                diagnosticRulesWithWarnings.push(rule);
            }
        }

        if (diagnosticRulesWithWarnings.length > 0) {
            throw new VerificationError(diagnosticRulesWithWarnings);
        }
    }
    private registrations = new Map<Constructor<unknown>, Registration<unknown>>();
    private interfaceMap = new Map<symbol, Constructor<unknown>[]>();

    register<T>(
        implementation: Constructor<T>,
        lifestyle: LifeStyleType = LifeStyles.Transient,
    ): void {
        this.registrations.set(implementation, { implementation, lifestyle });

        const interfaces: symbol[] = Reflect.getMetadata(metadata_contacts_key, implementation) || [];
        interfaces.forEach(i => {
            if (!this.interfaceMap.has(i)) {
                this.interfaceMap.set(i, []);
            }
            this.interfaceMap.get(i)!.push(implementation);
        });
    }

    resolve<T>(constructor: Constructor<T>): T {
        const registration = this.getRegistration(constructor);

        if (registration.lifestyle === LifeStyles.Singleton || registration.lifestyle === LifeStyles.Scoped) {
            if (!registration.instance) {
                registration.instance = this.createInstance(registration.implementation);
            }
            return registration.instance as T;
        }

        return this.createInstance(registration.implementation) as T;
    }

    getRegistration<T>(constructor: Constructor<T>): Registration<unknown> {
        const registration = this.registrations.get(constructor);
        if (!registration) {

            if(new constructor() instanceof Object) {
                const newRegistration:Registration<T> = {
                    lifestyle: LifeStyles.Transient,
                    implementation: constructor,
                }
                this.registrations.set(constructor, newRegistration);

                return newRegistration;
            }

            throw new Error(`Service not registered: ${constructor.name}`);
        }

        return registration;
    }

    protected createInstance<T>(constructor: Constructor<T>): T {
        const paramTypes = Reflect.getMetadata("design:paramtypes", constructor) || [];
        const parameters = paramTypes.map((param: Constructor<unknown>) => this.resolve(param));
        return new constructor(...parameters);
    }

    resolveAll<T>(i: symbol): T[] {
        const implementations = this.interfaceMap.get(i) || [];
        return implementations.map(impl => this.resolve(impl)) as T[];
    }

    createScope() :Container {
        return new ScopedContainer(this);
    }
}

class ScopedContainer extends Container {
    private scopedInstances = new Map<Constructor<unknown>, unknown>();

    constructor(private superContainer: Container) {
        super();
    }
    override resolve<T>(constructor: Constructor<T>): T {
        const registration = this.superContainer.getRegistration(constructor);

        if (registration.lifestyle === LifeStyles.Scoped) {
            if (!this.scopedInstances.has(constructor)) {
                this.scopedInstances.set(constructor, this.createInstance(registration.implementation));
            }
            return this.scopedInstances.get(constructor) as T;
        }

        return this.superContainer.resolve(constructor);
    }

}

export function Injectable<T>(...contacts: symbol[]): (Type: Constructor<T>) => void {
    return function (Type: Constructor<T>): void {
        Reflect.defineMetadata(metadata_contacts_key, contacts, Type);
    };
}