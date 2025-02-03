import { Container, Injectable, LifeStyles } from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";

Deno.test("Diagnostics for UnregisteredDependencies", () => {
  // Assign
  class _ServiceB {}

  @Injectable()
  class ServiceA {
    constructor(public serviceB: _ServiceB) {}
  }

  const container = new Container();
  container.register(ServiceA, LifeStyles.Transient);

  // Act Assert
  const warning =
    "_ServiceB required by ServiceA has not been registered with the container";
  const validatorName = "UnregisteredDependencies";
  assertValidationWarning(container, validatorName, warning);
});
