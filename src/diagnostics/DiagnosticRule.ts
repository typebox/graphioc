import type { Constructor } from '../Container.ts';
import { Reflect } from '@dx/reflect';

export abstract class DiagnosticRule {
  abstract name: string;
  abstract description: string;
  public warnings: string[] = [];
  abstract Verify(): void;

  protected getDependencies<T>(
    constructor: Constructor<T>,
  ): Constructor<unknown>[] {
    return Reflect.getMetadata('design:paramtypes', constructor) || [];
  }
}
