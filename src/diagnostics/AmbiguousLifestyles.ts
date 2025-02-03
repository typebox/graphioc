import type { Constructor, LifeStyleType } from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";
import { LifeStyles } from "../Container.ts";

export class AmbiguousLifestyles extends DiagnosticRule {
  private readonly registrationMap = new Map<
    Constructor<unknown>,
    Set<LifeStyleType>
  >();

  constructor() {
    super();
  }

  name: string = "AmbiguousLifestyles";
  description: string =
    "Detects services registered multiple times with different lifestyles.";

  Verify() {
    for (const [implementation, lifestyles] of this.registrationMap.entries()) {
      if (lifestyles.size === 0) {
        continue;
      }

      const lifestylesString = Array.from(lifestyles).join(", ");
      this.warnings.push(
        `${implementation.name} is registered with multiple lifestyles (${lifestylesString})`,
      );
    }
  }

  trackRegistration<T>(
    implementation: Constructor<T>,
    lifestyle: LifeStyleType = LifeStyles.Transient,
  ) {
    const lifestyles = this.registrationMap.get(implementation) ||
      new Set<LifeStyleType>();
    lifestyles.add(lifestyle);
    this.registrationMap.set(implementation, lifestyles);
  }
}
