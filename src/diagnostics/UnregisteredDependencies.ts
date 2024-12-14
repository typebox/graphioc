import type { Constructor, Registration } from '../Container.ts';
import { DiagnosticRule } from './DiagnosticRule.ts';

export class UnregisteredDependencies extends DiagnosticRule {
  name: string = 'UnregisteredDependencies';
  description: string =
    'Detects dependencies that have not been registered in the container.';
  visited = new Set<Constructor<unknown>>();

  constructor(
    private registrations: Map<Constructor<unknown>, Registration<unknown>>,
  ) {
    super();
  }

  Verify() {
    for (const [constructor, registration] of this.registrations.entries()) {
      this.analyzeUnregisteredDependencies(constructor, registration);
    }
  }

  private analyzeUnregisteredDependencies(
    constructor: Constructor<unknown>,
    registration: Registration<unknown>,
  ) {
    if (this.visited.has(constructor)) {
      return;
    }

    this.visited.add(constructor);

    const dependencies = this.getDependencies(registration.implementation);

    for (const dependency of dependencies) {
      if (!this.registrations.has(dependency)) {
        this.warnings.push(
          `${dependency.name} required by ${constructor.name} has not been registered with the container`,
        );
        continue;
      }

      const depRegistration = this.registrations.get(dependency)!;

      this.analyzeUnregisteredDependencies(dependency, depRegistration);
    }
  }
}
