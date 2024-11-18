import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles, type Constructor} from "../../src/di/container.ts";


Deno.test("Diagnostics for UnregisteredDependencies", () => {

    class ServiceB {}

    @Injectable()
    class ServiceA {
        constructor(public serviceB: ServiceB) {}
    }

    const container = new Container();
    container.register(ServiceA, LifeStyles.Transient);

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for UnregisteredDependencies:\nUnregistered dependency: ServiceB required by ServiceA",
        "Should throw an error when resolving an unregistered service"
    );

});