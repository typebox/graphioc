import type { Constructor, Registration } from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";

export class CircularDependencyRule extends DiagnosticRule {
  name: string = "CircularDependencyRule";
  description: string = "Detects circular dependencies in the DI container.";

  constructor(
    private registrations: Map<Constructor<unknown>, Registration<unknown>>,
  ) {
    super();
  }

  Verify(): void {
    const visited = new Set<Constructor<unknown>>();

    for (const [implementation] of this.registrations) {
      this.detectCycle(implementation, visited, []);
    }
  }

  private detectCycle(
    implementation: Constructor<unknown>,
    visited: Set<Constructor<unknown>>,
    stack: Constructor<unknown>[],
  ): void {
    if (visited.has(implementation)) return; // Already checked
    if (stack.includes(implementation)) {
      const cycle = [...stack, implementation].map((c) => c.name).join(" -> ");
      this.warnings.push(
        `${implementation.name} is involved in a circular dependency (${cycle})`,
      );
      return;
    }

    stack.push(implementation);
    const dependencies = this.getDependencies(implementation);
    for (const dep of dependencies) {
      this.detectCycle(dep, visited, stack);
    }
    stack.pop();
    visited.add(implementation);
  }
}
