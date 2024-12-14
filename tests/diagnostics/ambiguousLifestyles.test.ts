import { Container, LifeStyles } from '../../src/mod.ts';
import { assertValidationWarning } from './assertValidationWarning.ts';

Deno.test('Diagnostics for AmbiguousLifestyles', () => {
  class AmbiguousService {}

  // Registration with different lifestyles
  const container = new Container();
  container.register(AmbiguousService, LifeStyles.Transient);
  container.register(AmbiguousService, LifeStyles.Singleton);

  // Act & Assert
  const warning =
    'AmbiguousService is registered with multiple lifestyles (Transient, Singleton)';
  const validatorName = 'AmbiguousLifestyles';
  assertValidationWarning(container, validatorName, warning);
});
