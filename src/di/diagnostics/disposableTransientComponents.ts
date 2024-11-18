import {Constructor, LifeStyles, type Registration} from "../container.ts";
import { DiagnosticRule } from "./diagnosticRule.ts";


export class DisposableTransientComponents extends DiagnosticRule {
    constructor(private registrations: Map<Constructor<unknown>, Registration<unknown>>) {
      super();
    }

    Verify(): string[] {
        const warnings: string[] = [];

        for (const [constructor, registration] of this.registrations.entries()) {
            if (registration.lifestyle === LifeStyles.Transient && this.isDisposable(registration.implementation)) {
                warnings.push(
                    `Disposable transient component detected: ${registration.implementation.name} is transient and implements a dispose method.`
                );
            }
        }

        return warnings;
    }

    private isDisposable<T>(constructor: Constructor<T>): boolean {
        return typeof constructor.prototype.dispose === 'function';
    }

    name: string = "DisposableTransientComponents";
    description: string = "Detects transient components that implement a dispose method.";
}