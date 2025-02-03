import {
  type Constructor,
  LifeStyles,
  type Registration,
} from "../Container.ts";
import { DiagnosticRule } from "./DiagnosticRule.ts";

export class DisposableTransientComponents extends DiagnosticRule {
  constructor(
    private registrations: Map<Constructor<unknown>, Registration<unknown>>,
  ) {
    super();
  }

  Verify() {
    for (const [_constructor, registration] of this.registrations.entries()) {
      if (
        registration.lifestyle === LifeStyles.Transient &&
        this.isDisposable(registration.implementation)
      ) {
        this.warnings.push(
          `${registration.implementation.name} is transient and also implements a dispose method`,
        );
      }
    }
  }

  private isDisposable<T>(constructor: Constructor<T>): boolean {
    return typeof constructor.prototype[Symbol.dispose] === "function" ||
      typeof constructor.prototype[Symbol.asyncDispose] === "function";
  }

  name: string = "DisposableTransientComponents";
  description: string =
    `Components that implement IDisposable typically require deterministic cleanup. 
However, transient components, by design, are not automatically tracked or disposed. 
As a result, managing their lifecycle and ensuring proper disposal becomes the responsibility of the consumer.`;
}
