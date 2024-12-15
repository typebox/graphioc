import type { DiagnosticRule } from './diagnostics/DiagnosticRule.ts';
import { Reflect } from '@dx/reflect';
import { lifestyleMismatch } from './diagnostics/LifestyleMismatch.ts';
import { UnregisteredDependencies } from './diagnostics/UnregisteredDependencies.ts';
import { DisposableTransientComponents } from './diagnostics/DisposableTransientComponents.ts';
import { ShortCircuitedDependencies } from './diagnostics/ShortCircuitedDependencies.ts';
import { TornLifestyles } from './diagnostics/TornLifestyles.ts';
import { AmbiguousLifestyles } from './diagnostics/AmbiguousLifestyles.ts';
import { VerificationError } from './diagnostics/VerificationError.ts';

// using any is justified here as the container
// deno-lint-ignore no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

export const metadata_contacts_key = 'di:metadata:contacts';
export const design_paramtypes = 'design:paramtypes';

export const LifeStyles = {
  Singleton: 'Singleton',
  Transient: 'Transient',
  Scoped: 'Scoped',
} as const;

export type LifeStyleType = (typeof LifeStyles)[keyof typeof LifeStyles];

export interface Registration<T> {
  implementation: Constructor<T>;
  lifestyle: LifeStyleType;
  instance?: T;
}

export class Container {
  //tracks the registrations into the container mainly to know what the lifestyle
  private readonly registrations = new Map<
    Constructor<unknown>,
    Registration<unknown>
  >();

  // This keeps track of the interfaces and their concrete implementations
  private readonly interfaceMap = new Map<symbol, Constructor<unknown>[]>();

  // these are all the diagnostic rules that are applied to the container
  private readonly diagnosticRules: DiagnosticRule[] = [];
  private readonly lifestyleMismatch = new lifestyleMismatch(
    this.registrations,
  );
  private readonly shortCircuitedDependencies = new ShortCircuitedDependencies(
    this.registrations,
  );
  private readonly tornLifestyles = new TornLifestyles(
    this.registrations,
    this,
  );
  private readonly ambiguousLifestyles = new AmbiguousLifestyles();
  private readonly disposableTransientComponents =
    new DisposableTransientComponents(this.registrations);
  private readonly unregisteredDependencies = new UnregisteredDependencies(
    this.registrations,
  );

  constructor() {
    this.diagnosticRules = [
      this.lifestyleMismatch,
      this.shortCircuitedDependencies,
      this.tornLifestyles,
      this.ambiguousLifestyles,
      this.disposableTransientComponents,
      this.unregisteredDependencies,
    ];
  }

  Verify() {
    const diagnosticRulesWithWarnings: DiagnosticRule[] = [];

    for (const rule of this.diagnosticRules) {
      try {
        rule.Verify();
        if (rule.warnings.length > 0) {
          diagnosticRulesWithWarnings.push(rule);
        }
      } catch (error) {
        if (error instanceof Error) {
          rule.warnings.push(error.message);
          diagnosticRulesWithWarnings.push(rule);
          continue;
        }
        throw error;
      }
    }

    if (diagnosticRulesWithWarnings.length > 0) {
      throw new VerificationError(
        diagnosticRulesWithWarnings,
      );
    }
  }

  register<T>(
    implementation: Constructor<T>,
    lifestyle: LifeStyleType = LifeStyles.Transient,
  ): void {
    this.ambiguousLifestyles.trackRegistration(implementation, lifestyle);
    this.registrations.set(implementation, { implementation, lifestyle });

    const interfaces: unknown =
      Reflect.getMetadata(metadata_contacts_key, implementation) || [];

    if (
      !Array.isArray(interfaces) ||
      !interfaces.every((i) => typeof i === 'symbol')
    ) {
      throw new Error(
        `Invalid metadata for implementation ${implementation.name}. Expected an array of symbols.`,
      );
    }

    (interfaces as symbol[]).forEach((i) => {
      if (!this.interfaceMap.has(i)) {
        this.interfaceMap.set(i, []);
      }
      this.interfaceMap.get(i)!.push(implementation);
    });
  }

  resolve<T>(constructor: Constructor<T>): T {
    const registration = this.getRegistration(constructor);

    if (
      registration.lifestyle === LifeStyles.Singleton ||
      registration.lifestyle === LifeStyles.Scoped
    ) {
      if (!registration.instance) {
        registration.instance = this.createInstance(
          registration.implementation,
        );
      }
      return registration.instance as T;
    }

    return this.createInstance(registration.implementation) as T;
  }

  getRegistration<T>(constructor: Constructor<T>): Registration<unknown> {
    const registration = this.registrations.get(constructor);
    if (!registration) {
      if (this.isInstantiable(constructor)) {
        const newRegistration: Registration<T> = {
          lifestyle: LifeStyles.Transient,
          implementation: constructor,
        };
        this.registrations.set(constructor, newRegistration);

        return newRegistration;
      }

      throw new Error(
        `Service not registered: ${constructor.name}. ` +
          `Ensure the service is registered before resolving. Caller: ${
            new Error().stack
          }`,
      );
    }

    return registration;
  }

  protected isInstantiable<T>(constructor: Constructor<T>): boolean {
    try {
      if (!constructor.prototype) return false;
      const paramTypes = Reflect.getMetadata(design_paramtypes, constructor) ||
        [];
      if (!Array.isArray(paramTypes)) return false;
      return paramTypes.every(
        (param) => param instanceof Function && param.prototype !== undefined,
      );
    } catch {
      return false;
    }
  }

  protected createInstance<T>(constructor: Constructor<T>): T {
    const paramTypes = Reflect.getMetadata(design_paramtypes, constructor) ||
      [];
    const dependencyCache = new Map<Constructor<unknown>, unknown>();

    try {
      const parameters = paramTypes.map((param: Constructor<unknown>) => {
        if (!dependencyCache.has(param)) {
          try {
            const resolvedParam = this.resolve(param);
            dependencyCache.set(param, resolvedParam);
            return resolvedParam;
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(
                `Failed to resolve parameter ${param.name}: ${error.message}`,
              );
            }
            throw error;
          }
        }
        return dependencyCache.get(param);
      });
      return new constructor(...parameters);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to create instance for ${constructor.name}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  resolveAll<T>(i: symbol): T[] {
    const implementations = this.interfaceMap.get(i) || [];
    return implementations.map((impl) => this.resolve(impl)) as T[];
  }

  createScope(): Container {
    return new ScopedContainer(this);
  }
}

export class ScopedContainer extends Container {
  private scopedInstances = new Map<Constructor<unknown>, unknown>();

  constructor(private superContainer: Container) {
    super();
  }
  override resolve<T>(constructor: Constructor<T>): T {
    const registration = this.superContainer.getRegistration(constructor);

    if (registration.lifestyle !== LifeStyles.Scoped) {
      return this.superContainer.resolve(constructor);
    } else {
      if (!this.scopedInstances.has(constructor)) {
        this.scopedInstances.set(
          constructor,
          this.createInstance(registration.implementation),
        );
      }
      return this.scopedInstances.get(constructor) as T;
    }
  }
}

export function Injectable<T>(
  ...contacts: symbol[]
): (Type: Constructor<T>) => void {
  return function (Type: Constructor<T>): void {
    Reflect.defineMetadata(metadata_contacts_key, contacts, Type);
  };
}
