import {
  type Constructor,
  LifeStyles,
  type LifeStyleType,
  type Registration,
} from '../Container.ts';
import { DiagnosticRule } from './DiagnosticRule.ts';

export class lifestyleMismatch extends DiagnosticRule {
  constructor(
    private registrations: Map<Constructor<unknown>, Registration<unknown>>,
  ) {
    super();
  }

  visited = new Set<Constructor<unknown>>();

  Verify() {
    for (const [constructor, registration] of this.registrations.entries()) {
      this.analyzeLifestyleMismatches(constructor, registration, []);
    }
  }

  private analyzeLifestyleMismatches(
    constructor: Constructor<unknown>,
    registration: Registration<unknown>,
    path: Constructor<unknown>[],
  ) {
    if (this.visited.has(constructor)) {
      return;
    }
    this.visited.add(constructor);

    const dependencies = this.getDependencies(registration.implementation);

    for (const dependency of dependencies) {
      const depRegistration = this.registrations.get(dependency);

      if (!depRegistration) {
        continue;
      }

      if (
        this.isLifestyleMismatch(
          registration.lifestyle,
          depRegistration.lifestyle,
        )
      ) {
        this.warnings.push(
          `${registration.implementation.name} (${registration.lifestyle}) depends on ` +
            `${depRegistration.implementation.name} (${depRegistration.lifestyle})`,
        );
      }

      this.analyzeLifestyleMismatches(
        dependency,
        depRegistration,
        path.concat(constructor),
      );
    }
  }

  private isLifestyleMismatch(
    parentLifestyle: LifeStyleType,
    depLifestyle: LifeStyleType,
  ): boolean {
    const lifestyleOrder = {
      [LifeStyles.Transient]: 1,
      [LifeStyles.Scoped]: 2,
      [LifeStyles.Singleton]: 3,
    };

    const parentOrder = lifestyleOrder[parentLifestyle];
    const depOrder = lifestyleOrder[depLifestyle];

    return parentOrder > depOrder;
  }

  name: string = 'LifestyleMismatch';

  description: string = '';
}
