import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles} from "../../src/di/container.ts";


Deno.test("Diagnostics for LifestyleMismatch", () => {
    //Assign
    @Injectable()
    class Foo {}
    @Injectable()
    class Bah {
        constructor(public foo: Foo) {}
    }

    const container = new Container();
    container.register(Foo, LifeStyles.Transient);
    container.register(Bah, LifeStyles.Singleton);

    //Act Assert
    assertThrows(
        () => {
            container.Verify();
        },
        Error,
        "Verification failed:\nDiagnostics for LifestyleMismatch:\nLifestyle mismatch detected: Bah (Singleton) depends on Foo (Transient)",
        "Should throw an error when resolving an unregistered service"
    );

});