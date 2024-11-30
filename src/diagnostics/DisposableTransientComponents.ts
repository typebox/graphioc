import {type Constructor, LifeStyles, type Registration} from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";


export class DisposableTransientComponents extends DiagnosticRule {
    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }

    Verify() {
        for (const [_constructor, registration] of this.registrations.entries()) {
            if (registration.lifestyle === LifeStyles.Transient && this.isDisposable(registration.implementation)) {
                this.warnings.push(
                    `Disposable transient component detected: ${registration.implementation.name} is transient and implements a dispose method`
                );
            }
        }

    }

    private isDisposable<T>(constructor: Constructor<T>): boolean {
        return typeof constructor.prototype.dispose === 'function';
    }

    name: string = "DisposableTransientComponents";
    description: string = "Detects transient components that implement a dispose method.";
}