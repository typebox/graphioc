import { type Constructor, type Registration, type Container, LifeStyles } from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";

export class TornLifestyles extends DiagnosticRule {
    constructor(
        private registrations: Map<Constructor<unknown>, Registration<unknown>>,
        private container: Container
    ) {
        super();
    }

    name: string = "TornLifestyles";
    description: string = "Detects when multiple instances of a singleton or scoped service are created.";

    Verify(): string[] {
        const warnings: string[] = [];

        // Group registrations by implementation and lifestyle
        const groupedRegistrations = new Map<string, Registration<unknown>[]>();

        for (const registration of this.registrations.values()) {
            const key = `${registration.implementation.name}-${registration.lifestyle}`;
            if (!groupedRegistrations.has(key)) {
                groupedRegistrations.set(key, []);
            }
            groupedRegistrations.get(key)!.push(registration);
        }

        // Check each group for torn lifestyles
        for (const registrations of groupedRegistrations.values()) {
            if (registrations.length > 1) {
                const instances = registrations.map(reg => this.container.resolve(reg.implementation));
                const uniqueInstances = new Set(instances);
                if (uniqueInstances.size > 1) {
                    warnings.push(
                        `Torn lifestyle detected: Service '${registrations[0].implementation.name}' registered multiple times with lifestyle '${registrations[0].lifestyle}' resolves to different instances.`
                    );
                }
            } else {
                const registration = registrations[0];
                if (registration.lifestyle === LifeStyles.Singleton) {
                    const instance1 = this.container.resolve(registration.implementation);
                    const instance2 = this.container.resolve(registration.implementation);
                    if (instance1 !== instance2) {
                        warnings.push(
                            `Singleton service '${registration.implementation.name}' is resolving to multiple instances.`
                        );
                    }
                } else if (registration.lifestyle === LifeStyles.Scoped) {
                    const scope = this.container.createScope();
                    const instance1 = scope.resolve(registration.implementation);
                    const instance2 = scope.resolve(registration.implementation);
                    if (instance1 !== instance2) {
                        warnings.push(
                            `Scoped service '${registration.implementation.name}' resolves to different instances within the same scope.`
                        );
                    }
                    const scope2 = this.container.createScope();
                    const instance3 = scope2.resolve(registration.implementation);
                    if (instance1 === instance3) {
                        warnings.push(
                            `Scoped service '${registration.implementation.name}' is sharing instances across different scopes.`
                        );
                    }
                }
            }
        }

        return warnings;
    }
}
