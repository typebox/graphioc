import {type Constructor, Injectable, LifeStyles, Container} from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";


Deno.test("Diagnostics for TornLifestyles", () => {
    // Test classes
    @Injectable()
    class SingletonService {}

    // Simulate multiple registrations or misconfiguration
    const container = new Container();
    container.register(SingletonService, LifeStyles.Singleton);

    // Modify createInstance to always create a new instance (simulate misconfiguration)
    container['createInstance'] = function<T>(constructor: Constructor<T>): T {
        return new constructor();
    };

    // Act Assert
    const warning = "Multiple instances of SingletonService are created despite being registered as Singleton";
    const validatorName = "TornLifestyles";
    assertValidationWarning(container, validatorName, warning);

});