import {type Constructor, LifeStyles, Container, ScopedContainer} from "../../src/Container.ts";
import { assertValidationWarning } from "./assertValidationWarning.ts";

Deno.test("Diagnostics for TornLifestyles - Singleton resolves to multiple instances", () => {
    // Assign
    class SingletonService {}

    // Simulate misconfiguration where singleton service resolves to multiple instances
    const container = new Container();
    container.register(SingletonService, LifeStyles.Singleton);

    // Override resolve to always create a new instance (simulate misconfiguration)
    container["resolve"] = function<T>(constructor: Constructor<T>): T {
        return new constructor();
    };

    // Act & Assert
    const warning = "'SingletonService' registered as Singleton is resolving to multiple instances.";
    const validatorName = "TornLifestyles";

    // Verify that the diagnostic rule reports the expected warning
    assertValidationWarning(container, validatorName, warning);
});

Deno.test("Diagnostics for TornLifestyles - Scoped resolves to same instance within different scopes", () => {
    // Assign
    class ScopedService {}

    // Simulate misconfiguration where scoped service resolves to the same instance across different scopes
    const container = new Container();
    container.register(ScopedService, LifeStyles.Scoped);

    // Override createScope to simulate improper scope management
    const scopedContainer = new ScopedContainer(container);
    scopedContainer["resolve"] = function<T>(): T {
        return container.resolve(ScopedService) as T;
    };

    container["createScope"] = () => {
        return scopedContainer;
    };

    // Act & Assert
    const warning = "'ScopedService' registered as Scoped is sharing instances across different scopes.";
    const validatorName = "TornLifestyles";

    // Verify that the diagnostic rule reports the expected warning
    assertValidationWarning(container, validatorName, warning);
});

Deno.test("Diagnostics for TornLifestyles - Scoped resolves to different instances within same scope", () => {
    // Assign
    class ScopedService {}

    // Simulate misconfiguration where scoped service resolves to different instances within the same scope
    const container = new Container();
    container.register(ScopedService, LifeStyles.Scoped);

    // Override createScope to simulate improper instance management
    const scopedContainer = new ScopedContainer(container);
    scopedContainer["resolve"] = function<T>(constructor: Constructor<T>): T {
        return new constructor()
    };

    container["createScope"] = () => {
        return scopedContainer;
    };

    // Act & Assert
    const warning = "'ScopedService' registered as Scoped resolves to different instances within the same scope.";
    const validatorName = "TornLifestyles";

    // Verify that the diagnostic rule reports the expected warning
    assertValidationWarning(container, validatorName, warning);
});

Deno.test("Diagnostics for TornLifestyles - Singleton correctly resolves to single instance", () => {
    // Assign
    class SingletonService {}

    // Proper configuration where singleton service resolves to the same instance
    const container = new Container();
    container.register(SingletonService, LifeStyles.Singleton);

    // Act & Assert
    const validatorName = "TornLifestyles";
    const warning = undefined; // No warnings expected

    // Verify that no warnings are reported
    assertValidationWarning(container, validatorName, warning);
});

Deno.test("Diagnostics for TornLifestyles - Scoped correctly resolves within and across scopes", () => {
    // Assign
    class ScopedService {}

    // Proper configuration where scoped service resolves correctly within and across scopes
    const container = new Container();
    container.register(ScopedService, LifeStyles.Scoped);

    // Act & Assert
    const validatorName = "TornLifestyles";
    const warning = undefined; // No warnings expected

    // Verify that no warnings are reported
    assertValidationWarning(container, validatorName, warning);
});
