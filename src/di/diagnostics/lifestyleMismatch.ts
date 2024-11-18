import { Constructor, LifeStyles, type LifeStyleType, type Registration } from "../container.ts";
import {DiagnosticRule} from "./diagnosticRule.ts";

export class lifestyleMismatch extends DiagnosticRule{

    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }
    Verify(): string[] {
        const warnings: string[] = [];
        const visited = new Set<Constructor<unknown>>();

        for (const [constructor, registration] of this.registrations.entries()) {
            this.analyzeLifestyleMismatches(constructor, registration, [], warnings, visited);
        }

        return warnings;
    }

    private analyzeLifestyleMismatches(
        constructor: Constructor<unknown>,
        registration: Registration<unknown>,
        path: Constructor<unknown>[],
        warnings: string[],
        visited: Set<Constructor<unknown>>
    ) {
        if (visited.has(constructor)) {
            return;
        }
        visited.add(constructor);

        const dependencies = this.getDependencies(registration.implementation);

        for (const dependency of dependencies) {
            const depRegistration = this.registrations.get(dependency);

            if (!depRegistration) {
                continue;
            }

            if (this.isLifestyleMismatch(registration.lifestyle, depRegistration.lifestyle)) {
                warnings.push(
                    `Lifestyle mismatch detected: ${registration.implementation.name} (${registration.lifestyle}) depends on ` +
                    `${depRegistration.implementation.name} (${depRegistration.lifestyle})`
                );
            }

            this.analyzeLifestyleMismatches(
                dependency,
                depRegistration,
                path.concat(constructor),
                warnings,
                visited
            );
        }
    }

    private isLifestyleMismatch(parentLifestyle: LifeStyleType, depLifestyle: LifeStyleType): boolean {
        const lifestyleOrder = {
            [LifeStyles.Transient]: 1,
            [LifeStyles.Scoped]: 2,
            [LifeStyles.Singleton]: 3
        };

        const parentOrder = lifestyleOrder[parentLifestyle];
        const depOrder = lifestyleOrder[depLifestyle];

        return parentOrder > depOrder;
    }

    name: string = "LifestyleMismatch";

    description: string = "";

}