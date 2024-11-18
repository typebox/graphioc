import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles} from "../../src/di/container.ts";


Deno.test("Diagnostics for DisposableTransientComponents", () => {
    @Injectable()
    class DisposableTransientService {
        dispose() {
            // Dispose resources
        }
    }

    // Registration
    const container = new Container();
    container.register(DisposableTransientService, LifeStyles.Transient);

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for DisposableTransientComponents:\nDisposable transient component detected: DisposableTransientService is transient and implements a dispose method.",
        "Should throw an error when resolving an unregistered service"
    );

});