import { assertInstanceOf } from '@std/assert';
import type { Container } from '../../src/Container.ts';
import { VerificationError } from '../../src/diagnostics/VerificationError.ts';
import { assert, assertExists } from '@std/assert';

export function assertValidationWarning(
  container: Container,
  validatorName: string,
  warning?: string,
) {
  try {
    container.Verify();
  } catch (e) {
    assertInstanceOf(e, VerificationError);
    const diagnosticRule = e.diagnosticRulesWithWarnings
      .find((w) => {
        return w.name === validatorName;
      });

    //
    if (!diagnosticRule) return;

    assertExists(diagnosticRule);

    if (!warning) return;

    assert(
      diagnosticRule.warnings.includes(warning),
      `"${JSON.stringify(e.warnings)}" does not contain "${warning}"`,
    );

    return;
  }

  assert(false, `no ${validatorName} detected`);
}
