import type { Constructor, Registration } from '../Container.ts';
import { DiagnosticRule } from './DiagnosticRule.ts';

export class ShortCircuitedDependencies extends DiagnosticRule {
  constructor(
    private registrations: Map<Constructor<unknown>, Registration<unknown>>,
  ) {
    super();
  }

  name: string = 'ShortCircuitedDependencies';
  description: string =
    'Detects dependencies that are not properly injected and are being replaced with a default or null value.';

  visited = new Set<Constructor<unknown>>();

  Verify() {
    for (const [constructor, registration] of this.registrations.entries()) {
      this.analyzeDependencies(constructor, registration);
    }
  }

  private analyzeDependencies(
    constructor: Constructor<unknown>,
    registration: Registration<unknown>,
  ) {
    if (this.visited.has(constructor)) {
      return;
    }
    this.visited.add(constructor);

    const dependencies = this.getDependencies(registration.implementation);

    for (const dependency of dependencies) {
      if (!dependency) {
        this.warnings.push(
          `A dependency in ${constructor.name} is being replaced with null or undefined`,
        );
        continue;
      }

      const depRegistration = this.registrations.get(dependency);

      if (!depRegistration) {
        continue;
      }

      this.analyzeDependencies(dependency, depRegistration);
    }
  }
}
