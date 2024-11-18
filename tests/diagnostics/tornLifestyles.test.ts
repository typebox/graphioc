import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles, type Constructor} from "../../src/di/container.ts";


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

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for TornLifestyles:\nUnregistered dependency: ServiceB required by Torn lifestyle detected: Multiple instances of SingletonService are created despite being registered as Singleton.",
        "Should throw an error when resolving an unregistered service"
    );

});