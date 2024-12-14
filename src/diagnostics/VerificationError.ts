import type {DiagnosticRule} from "./DiagnosticRule.ts";

export class VerificationError extends Error {
    public warnings:string[];
    constructor(public diagnosticRulesWithWarnings: DiagnosticRule[]) {

        const warnings = diagnosticRulesWithWarnings.map(r=>r.warnings.join(', '));

        super('Verification failed: ' + warnings);
        this.warnings = warnings;
        this.name = "VerificationError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}