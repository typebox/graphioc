import { Container, LifeStyles } from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";

Deno.test("Diagnostics for CircularDependencyRule", () => {
  class A {
    constructor(public b: B) {}
  }

  class B {
    constructor(public a: A) {}
  }

  const container = new Container();
  container.register(A, LifeStyles.Transient);
  container.register(B, LifeStyles.Transient);

  // Act & Assert
  const warning = "A is involved in a circular dependency (A -> B -> A)";
  const validatorName = "CircularDependencyRule";

  assertValidationWarning(container, validatorName, warning);
});
