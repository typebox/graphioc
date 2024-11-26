// tornLifestyles.ts
import { Constructor, Registration, LifeStyles } from "../container.ts";
import { DiagnosticRule } from "./diagnosticRule.ts";

export class TornLifestyles extends DiagnosticRule {
    constructor(
        private registrations: Map<Constructor<unknown>, Registration<unknown>>,
        private createInstance: <T>(constructor: Constructor<T>) => T
    ) {
      super();
    }

    name: string = "TornLifestyles";
    description: string = "Detects when multiple instances of a singleton or scoped service are created.";

    Verify(): string[] {
        const warnings: string[] = [];

        for (const [constructor, registration] of this.registrations.entries()) {
            if (registration.lifestyle === LifeStyles.Singleton || registration.lifestyle === LifeStyles.Scoped) {
                const instance1 = this.createInstance(registration.implementation);
                const instance2 = this.createInstance(registration.implementation);

                if (instance1 !== instance2) {
                    warnings.push(
                        `Torn lifestyle detected: Multiple instances of ${registration.implementation.name} are created despite being registered as ${registration.lifestyle}.`
                    );
                }
            }
        }

        return warnings;
    }
}
