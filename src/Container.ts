import type {DiagnosticRule} from './diagnostics/DiagnosticRule.ts';
import {Reflect} from '@dx/reflect';
import {lifestyleMismatch} from './diagnostics/LifestyleMismatch.ts';
import {UnregisteredDependencies} from './diagnostics/UnregisteredDependencies.ts';
import {DisposableTransientComponents} from './diagnostics/DisposableTransientComponents.ts';
import {ShortCircuitedDependencies} from './diagnostics/ShortCircuitedDependencies.ts';
import {TornLifestyles} from './diagnostics/TornLifestyles.ts';
import {AmbiguousLifestyles} from './diagnostics/AmbiguousLifestyles.ts';
import {VerificationError} from './diagnostics/VerificationError.ts';
import {CircularDependencyRule} from "./diagnostics/CircularDependencyRule.ts";

// Using "any" here is justified to allow flexibility for any constructor.
// deno-lint-ignore no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

export const metadata_contacts_key = 'di:metadata:contacts';
export const design_paramtypes = 'design:paramtypes';

// Define lifecycle types for dependency registrations.
export const LifeStyles = {
  Singleton: 'Singleton',
  Transient: 'Transient',
  Scoped: 'Scoped',
} as const;

// Type for the lifecycle values.
export type LifeStyleType = (typeof LifeStyles)[keyof typeof LifeStyles];

// Interface for disposable services
export interface Disposable {
  [Symbol.dispose](): void;
}

// Structure to represent a registration in the container.
export interface Registration<T> {
  implementation: Constructor<T>;
  lifestyle: LifeStyleType;
  instance?: T;
}

export class Container {

  private readonly registrations = new Map<
    Constructor<unknown>,
    Registration<unknown>
  >();
  private readonly interfaceMap = new Map<symbol, Constructor<unknown>[]>();

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
  private readonly circularDependencyRule = new CircularDependencyRule(
      this.registrations
  );

  protected readonly scopedContainers: Set<ScopedContainer> = new Set();

  constructor() {
    this.diagnosticRules = [
      this.lifestyleMismatch,
      this.shortCircuitedDependencies,
      this.tornLifestyles,
      this.ambiguousLifestyles,
      this.disposableTransientComponents,
      this.unregisteredDependencies,
      this.circularDependencyRule
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
          // Collect rule warnings in case of an error.
          rule.warnings.push(error.message);
          diagnosticRulesWithWarnings.push(rule);
          continue;
        }
        throw error;
      }
    }

    if (diagnosticRulesWithWarnings.length > 0) {
      throw new VerificationError(diagnosticRulesWithWarnings);
    }
  }

  // Register a class with its lifecycle in the container.
  register<T>(
    implementation: Constructor<T>,
    lifestyle: LifeStyleType = LifeStyles.Transient,
  ): void {
    // Track ambiguous lifestyle registrations.
    this.ambiguousLifestyles.trackRegistration(implementation, lifestyle);
    this.registrations.set(implementation, { implementation, lifestyle });

    // Retrieve interface metadata for the implementation.
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

    // Map interfaces to their implementations.
    (interfaces as symbol[]).forEach((i) => {
      if (!this.interfaceMap.has(i)) {
        this.interfaceMap.set(i, []);
      }
      this.interfaceMap.get(i)!.push(implementation);
    });
  }

  // Resolve a registered class or instantiate it dynamically.
  resolve<T>(constructor: Constructor<T>): T {
    const registration = this.getRegistration(constructor);

    if (
      registration.lifestyle === LifeStyles.Singleton ||
      registration.lifestyle === LifeStyles.Scoped
    ) {
      // Reuse existing instance for Singleton or Scoped lifestyles.
      if (!registration.instance) {
        registration.instance = this.createInstance(
          registration.implementation,
        );
      }
      return registration.instance as T;
    }

    // Create a new instance for Transient lifestyle.
    return this.createInstance(registration.implementation) as T;
  }

  // Retrieve or create a registration for a constructor.
  getRegistration<T>(constructor: Constructor<T>): Registration<unknown> {
    const registration = this.registrations.get(constructor);
    if (!registration) {
      if (this.isInstantiable(constructor)) {
        // Automatically register classes that are instantiable.
        const newRegistration: Registration<T> = {
          lifestyle: LifeStyles.Transient,
          implementation: constructor,
        };
        this.registrations.set(constructor, newRegistration);
        return newRegistration;
      }

      const errorStack =
        new Error().stack?.split(/\r?\n/).slice(1).join('\n') ||
        'Stack not available';
      throw new Error(
        `Service not registered: ${constructor.name}. ` +
          `Ensure the service is registered before resolving. Caller stack trace: \n${errorStack}`,
      );
    }

    return registration;
  }

  // Check if a constructor can be instantiated.
  protected isInstantiable<T>(constructor: Constructor<T>): boolean {
    try {
      if (!constructor.prototype) return false; // Must have a prototype.
      const paramTypes = Reflect.getMetadata(design_paramtypes, constructor) ||
        []; // Metadata for constructor parameters.
      if (!Array.isArray(paramTypes)) return false;
      return paramTypes.every(
        (param) => param instanceof Function && param.prototype !== undefined,
      );
    } catch {
      return false; // Treat as not instantiable if metadata is missing or invalid.
    }
  }

  // Create an instance of a constructor with resolved dependencies.
  protected createInstance<T>(constructor: Constructor<T>): T {
    const paramTypes = Reflect.getMetadata(design_paramtypes, constructor) || [];
    const parameters = paramTypes.map((param: Constructor<unknown>) => this.resolve(param));
    return new constructor(...parameters);
  }

  // Resolve all implementations registered for a specific interface.
  resolveAll<T>(i: symbol): T[] {
    const implementations = this.interfaceMap.get(i) || [];
    return implementations.map((impl) => this.resolve(impl)) as T[];
  }

  // Create a scoped container for managing scoped instances.
  createScope(): Container {
    const scopedContainer = new ScopedContainer(this);
    this.scopedContainers.add(scopedContainer);
    return scopedContainer;
  }

  removeScope(scopedContainer: ScopedContainer): void {
    this.scopedContainers.delete(scopedContainer);
  }

  // Dispose method using Symbol.dispose
  dispose(): void {
    // Dispose all child scoped containers
    for (const scopedContainer of this.scopedContainers) {
      scopedContainer.dispose();
    }
    this.scopedContainers.clear();

    for (const [_, instance] of this.registrations) {
      if (
        instance.instance &&
        typeof (instance.instance as Disposable)[Symbol.dispose] === 'function'
      ) {
        try {
          (instance.instance as Disposable)[Symbol.dispose]();
        } catch (error) {
          console.warn(`Error disposing instance: ${error}`);
        }
      }
    }

    this.registrations.clear();
    this.interfaceMap.clear();
  }
}

export class ScopedContainer extends Container {
  private scopedInstances = new Map<Constructor<unknown>, unknown>();

  constructor(private superContainer: Container) {
    super();
  }

  // Override resolve to manage scoped instances differently.
  override resolve<T>(constructor: Constructor<T>): T {
    const registration = this.superContainer.getRegistration(constructor);

    if (registration.lifestyle !== LifeStyles.Scoped) {
      // Delegate resolution to the parent container for non-scoped instances.
      return this.superContainer.resolve(constructor);
    } else {
      // Maintain a unique instance for scoped lifecycles.
      if (!this.scopedInstances.has(constructor)) {
        this.scopedInstances.set(
          constructor,
          this.createInstance(registration.implementation),
        );
      }
      return this.scopedInstances.get(constructor) as T;
    }
  }

  override dispose(): void {
    for (const [_, instance] of this.scopedInstances) {
      if (
        instance &&
        typeof (instance as Disposable)[Symbol.dispose] === 'function'
      ) {
        try {
          (instance as Disposable)[Symbol.dispose]();
        } catch (error) {
          console.warn(`Error disposing scoped instance: ${error}`);
        }
      }
    }

    this.scopedInstances.clear();
    super.removeScope(this);
  }
}

// Decorator to mark classes as injectable and associate them with interfaces.
export function Injectable<T>(
  ...contacts: symbol[]
): (Type: Constructor<T>) => void {
  return function (Type: Constructor<T>): void {
    Reflect.defineMetadata(metadata_contacts_key, contacts, Type);
  };
}
