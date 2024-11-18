import {Reflect} from "jsr:@dx/reflect";
import {lifestyleMismatch} from "./diagnostics/lifestyleMismatch.ts";
import type { DiagnosticRule } from "./diagnostics/diagnosticRule.ts";
import {UnregisteredDependencies} from "./diagnostics/unregisteredDependencies.ts";
import { DisposableTransientComponents } from "./diagnostics/disposableTransientComponents.ts";
import {ShortCircuitedDependencies} from "./diagnostics/shortCircuitedDependencies.ts";
import { TornLifestyles } from "./diagnostics/tornLifestyles.ts";
import { AmbiguousLifestyles } from "./diagnostics/ambiguousLifestyles.ts";

// deno-lint-ignore no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

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
        // Initialize diagnostic rules
        this.diagnostics.push(new lifestyleMismatch(this.registrations));
        this.diagnostics.push(new ShortCircuitedDependencies(this.registrations));
        this.diagnostics.push(new TornLifestyles(this.registrations, (ctor) => this.createInstance(ctor)));
        this.diagnostics.push(new AmbiguousLifestyles(this.registrations));
        this.diagnostics.push(new DisposableTransientComponents(this.registrations));
        this.diagnostics.push(new UnregisteredDependencies(this.registrations));
    }

    Verify() {
        const warnings: string[] = [];

        for (const rule of this.diagnostics) {
            const ruleWarnings = rule.Verify();
            if (ruleWarnings.length > 0) {
                warnings.push(`Diagnostics for ${rule.name}:`);
                warnings.push(...ruleWarnings);
            }
        }

        if (warnings.length > 0) {
            throw new Error('Verification failed:\n' + warnings.join('\n'));
        }
    }
    private registrations = new Map<Constructor<unknown>, Registration<unknown>>();
    private interfaceMap = new Map<symbol, Constructor<unknown>[]>();

    register<T>(
        implementation: Constructor<T>,
        lifestyle: LifeStyleType = "Transient",
    ): void {
        this.registrations.set(implementation, { implementation, lifestyle });

        const interfaces: symbol[] = Reflect.getMetadata("di:metadata:interfaces", implementation) || [];
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

    getRegistration<T>(constructor: Constructor<T>) {
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

export function Injectable<T>(...interfaces: symbol[]): (Type: Constructor<T>) => void {
    return function (Type: Constructor<T>): void {
        Reflect.defineMetadata('di:metadata:interfaces', interfaces, Type);
    };
}
