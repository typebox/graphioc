import {Constructor, type Registration} from "../container.ts";
import { DiagnosticRule } from "./diagnosticRule.ts";


export class UnregisteredDependencies extends DiagnosticRule {
    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }

    Verify(): string[] {
        const warnings: string[] = [];
        const visited = new Set<Constructor<unknown>>();

        for (const [constructor, registration] of this.registrations.entries()) {
            this.analyzeUnregisteredDependencies(constructor, registration, warnings, visited);
        }

        return warnings;
    }

    private analyzeUnregisteredDependencies(
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
            if (!this.registrations.has(dependency)) {
                warnings.push(`Unregistered dependency: ${dependency.name} required by ${constructor.name}`);
                continue;
            }

            const depRegistration = this.registrations.get(dependency)!;

            this.analyzeUnregisteredDependencies(dependency, depRegistration, warnings, visited);
        }
    }

    name: string = "UnregisteredDependencies";
    description: string = "Detects dependencies that have not been registered in the container.";
}
