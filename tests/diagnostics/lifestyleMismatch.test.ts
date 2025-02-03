import { Container, LifeStyles } from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";

Deno.test("Diagnostics for LifestyleMismatch", () => {
  //Assign
  class Foo {}

  class Bah {
    constructor(public foo: Foo) {}
  }

  const container = new Container();
  container.register(Foo, LifeStyles.Transient);
  container.register(Bah, LifeStyles.Singleton);

  // Act & Assert
  const warning = "Bah (Singleton) depends on Foo (Transient)";
  const validatorName = "LifestyleMismatch";
  assertValidationWarning(container, validatorName, warning);
});
