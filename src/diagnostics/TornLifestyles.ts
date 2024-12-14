import {type Constructor, type Container, LifeStyles, type Registration} from "../Container.ts";
import {DiagnosticRule} from "./DiagnosticRule.ts";

export class TornLifestyles extends DiagnosticRule {
    constructor(
        private registrations: Map<Constructor<unknown>, Registration<unknown>>,
        private container: Container
    ) {
        super();
    }

    name: string = "TornLifestyles";
    description: string = "Detects when multiple instances of a singleton or scoped service are created.";

    Verify(){

        // Group registrations by implementation and lifestyle
        const groupedRegistrations = new Map<string, Registration<unknown>[]>();

        for (const registration of this.registrations.values()) {
            const key = `${registration.implementation.name}-${registration.lifestyle}`;
            if (!groupedRegistrations.has(key)) {
                groupedRegistrations.set(key, []);
            }
            groupedRegistrations.get(key)!.push(registration);
        }

        for (const registrations of groupedRegistrations.values()) {
            const registration = registrations[0];
            switch (registration.lifestyle) {
                case LifeStyles.Singleton:
                    this.VerifySingleton(registration);
                    break;
                case LifeStyles.Scoped:
                    this.VerifyScoped(registration);
                    break;
            }
        }

    }

    private VerifyScoped(registration: Registration<unknown>) {
        const warning = `'${registration.implementation.name}' registered as Scoped resolves to different instances within the same scope.`
        const scope = this.container.createScope();
        const instance1 = scope.resolve(registration.implementation);
        const instance2 = scope.resolve(registration.implementation);
        if (instance1 !== instance2) {
            this.warnings.push(warning);
        }

        const scope2 = this.container.createScope();
        const instance3 = scope2.resolve(registration.implementation);
        if (instance1 === instance3) {
            this.warnings.push(
                `'${registration.implementation.name}' registered as Scoped is sharing instances across different scopes.`
            );
        }
    }

    private VerifySingleton(registration: Registration<unknown>) {
        const warning = `'${registration.implementation.name}' registered as Singleton is resolving to multiple instances.`;
        const instance1 = this.container.resolve(registration.implementation);
        const instance2 = this.container.resolve(registration.implementation);
        if (instance1 !== instance2) {
            this.warnings.push(warning);
        }
    }
}
