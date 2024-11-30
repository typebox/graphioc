import { assertThrows } from "@std/assert";
import {Container, Injectable, LifeStyles} from "../../src/Container.ts";
import {assertValidationWarning} from "./assertValidationWarning.ts";


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


    // Act & Assert
    const warning = "DisposableTransientService is transient and implements a dispose method";
    const validatorName = "DisposableTransientComponents";
    assertValidationWarning(container, validatorName, warning);

});