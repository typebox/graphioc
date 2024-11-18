import { Constructor, Registration } from "../container.ts";
import { DiagnosticRule } from "./diagnosticRule.ts";

export class ShortCircuitedDependencies extends DiagnosticRule {
    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }

    name: string = "ShortCircuitedDependencies";
    description: string = "Detects dependencies that are not properly injected and are being replaced with a default or null value.";

    Verify(): string[] {
        const warnings: string[] = [];
        const visited = new Set<Constructor<unknown>>();

        for (const [constructor, registration] of this.registrations.entries()) {
            this.analyzeDependencies(constructor, registration, warnings, visited);
        }

        return warnings;
    }

    private analyzeDependencies(
        constructor: Constructor<unknown>,
        registration: Registration<unknown>,
        warnings: string[],
        visited: Set<Constructor<unknown>>
    ) {
        if (visited.has(constructor)) {
            return;
        }
        visited.add(constructor);

        const dependencies = this.getDependencies(registration.implementation);

        for (const dependency of dependencies) {
            if (!dependency) {
                warnings.push(`Short-circuited dependency detected: A dependency in ${constructor.name} is being replaced with null or undefined.`);
                continue;
            }

            const depRegistration = this.registrations.get(dependency);

            if (!depRegistration) {
                warnings.push(`Unregistered dependency: ${dependency.name} required by ${constructor.name}`);
                continue;
            }

            this.analyzeDependencies(dependency, depRegistration, warnings, visited);
        }
    }
}
