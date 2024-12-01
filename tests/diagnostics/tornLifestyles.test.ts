import { type Constructor, Injectable, LifeStyles, Container } from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";

Deno.test("Diagnostics for TornLifestyles", () => {
    // Assign

    @Injectable()
    class SingletonService {}

    // Simulate misconfiguration where singleton service resolves to multiple instances
    const container = new Container();
    container.register(SingletonService, LifeStyles.Singleton);

    // Override createInstance to always create a new instance (simulate misconfiguration)
    container['createInstance'] = function<T>(constructor: Constructor<T>): T {
        // Do not set the instance on the registration to simulate the singleton not being cached
        return new constructor();
    };

    // Act & Assert
    const warning = "Singleton service 'SingletonService' is resolving to multiple instances.";
    const validatorName = "TornLifestyles";

    // Verify that the diagnostic rule reports the expected warning
    assertValidationWarning(container, validatorName, warning);
});