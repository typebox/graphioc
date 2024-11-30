import {Container, Injectable, LifeStyles} from "../../src/Container.ts";
import {assertValidationWarning} from "./assertValidationWarning.ts";


Deno.test("Diagnostics for ShortCircuitedDependencies", () => {
    // Assign
    const IServiceB: unique symbol = Symbol("IServiceB");
    // deno-lint-ignore no-empty-interface
    interface IServiceB {}

    @Injectable(IServiceB)
    class ServiceB implements IServiceB {}

    @Injectable()
    class ServiceA {
        constructor(public serviceB: ServiceB) {}
    }

    const container = new Container();
    container.register<IServiceB>(ServiceB, LifeStyles.Singleton);
    container.register(ServiceA, LifeStyles.Transient);

    // Act & Assert
    const warning = "ServiceA (Transient) depends on ServiceB (Transient) instead of the registered abstraction IServiceB (Singleton)";
    const validatorName = "ShortCircuitedDependencies";
    assertValidationWarning(container, validatorName, warning);

});