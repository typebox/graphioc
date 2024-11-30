import type { Constructor, Registration, LifeStyleType } from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";

export class AmbiguousLifestyles extends DiagnosticRule {
    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }

    name: string = "AmbiguousLifestyles";
    description: string = "Detects services registered multiple times with different lifestyles.";

    Verify() {
        const registrationMap = new Map<Constructor<unknown>, Set<LifeStyleType>>();

        for (const registration of this.registrations.values()) {
            const lifestyles = registrationMap.get(registration.implementation) || new Set<LifeStyleType>();
            lifestyles.add(registration.lifestyle);
            registrationMap.set(registration.implementation, lifestyles);
        }

        for (const [implementation, lifestyles] of registrationMap.entries()) {
            if (lifestyles.size > 1) {
                this.warnings.push(
                    `Ambiguous lifestyles detected: ${implementation.name} is registered with multiple lifestyles (${Array.from(
                        lifestyles
                    ).join(", ")})`
                );
            }
        }
    }
}