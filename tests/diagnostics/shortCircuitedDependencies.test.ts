import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles} from "../../src/di/container.ts";


Deno.test("Diagnostics for ShortCircuitedDependencies", () => {
    //Assign
    @Injectable()
    class ServiceA {
        constructor(public serviceB?: ServiceB) {}
    }

    class ServiceB {}

    // Registration
    const container = new Container();
    container.register(ServiceA, LifeStyles.Transient);
    // Note: ServiceB is not registered

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for ShortCircuitedDependencies:\nUnregistered dependency: ServiceB required by ServiceA",
        "Should throw an error when resolving an unregistered service"
    );

});