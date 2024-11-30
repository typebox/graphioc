import type {DiagnosticRule} from "./DiagnosticRule.ts";

export class VerificationError extends Error {
    constructor(public warnings: DiagnosticRule[]) {

        super('Verification failed: ' + warnings.join(', '));
        this.name = "VerificationError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}