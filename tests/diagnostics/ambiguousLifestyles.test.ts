import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles} from "../../src/di/container.ts";


Deno.test("Diagnostics for AmbiguousLifestyles", () => {
    @Injectable()
    class AmbiguousService {}

    // Registration with different lifestyles
    const container = new Container();
    container.register(AmbiguousService, LifeStyles.Transient);
    container.register(AmbiguousService, LifeStyles.Singleton);

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for AmbiguousLifestyles:\nAmbiguous lifestyles detected: AmbiguousService is registered with multiple lifestyles (Transient, Singleton).",
        "Should throw an error when resolving an unregistered service"
    );

});