import { Container, Injectable, LifeStyles } from "../src/Container.ts";

// Stress testing container with multiple dependencies
@Injectable()
class Buzz {}

@Injectable()
class Foo {
  constructor(public buzz: Buzz) {}
}

@Injectable()
class Bah {
  constructor(public foo: Foo) {}
}

@Injectable()
class Bar {
  constructor(public bah: Bah) {}
}

@Injectable()
class Baz {
  constructor(public bar: Bar) {}
}

@Injectable()
class Qux {
  constructor(public baz: Baz) {}
}

const transientContainer = new Container();
transientContainer.register(Buzz, LifeStyles.Transient);
transientContainer.register(Foo, LifeStyles.Transient);
transientContainer.register(Bah, LifeStyles.Transient);
transientContainer.register(Bar, LifeStyles.Transient);
transientContainer.register(Baz, LifeStyles.Transient);
transientContainer.register(Qux, LifeStyles.Transient);

Deno.bench("stress test for Transient services", {
  group: "LifeStyles Transient vs Singleton",
}, async () => {
  await Promise.all(
    Array.from({ length: 1000 }, () => transientContainer.resolve(Foo)),
  );
});

const singletonContainer = new Container();
singletonContainer.register(Buzz, LifeStyles.Singleton);
singletonContainer.register(Foo, LifeStyles.Singleton);
singletonContainer.register(Bah, LifeStyles.Singleton);
singletonContainer.register(Bar, LifeStyles.Singleton);
singletonContainer.register(Baz, LifeStyles.Singleton);
singletonContainer.register(Qux, LifeStyles.Singleton);

Deno.bench("stress test for Singleton services", {
  group: "LifeStyles Transient vs Singleton",
}, async () => {
  await Promise.all(
    Array.from({ length: 1000 }, () => singletonContainer.resolve(Foo)),
  );
});

const parentContainer = new Container();
parentContainer.register(Buzz, LifeStyles.Scoped);
parentContainer.register(Foo, LifeStyles.Scoped);
parentContainer.register(Bah, LifeStyles.Scoped);
parentContainer.register(Bar, LifeStyles.Scoped);
parentContainer.register(Baz, LifeStyles.Scoped);
parentContainer.register(Qux, LifeStyles.Scoped);

Deno.bench("stress test for Scoped services from parent container", {
  group: "parent vs scoped container",
}, async () => {
  await Promise.all(
    Array.from({ length: 1000 }, () => parentContainer.resolve(Foo)),
  );
});

const scopedContainer = parentContainer.createScope();
Deno.bench("stress test for Scoped services from scoped container", {
  group: "parent vs scoped container",
}, async () => {
  await Promise.all(
    Array.from({ length: 1000 }, () => scopedContainer.resolve(Foo)),
  );
});

Deno.bench("stress test for creating container", async () => {
  await Promise.all(Array.from({ length: 1000 }, () => new Container()));
});

Deno.bench("stress test for creating scoped container", async () => {
  await Promise.all(
    Array.from({ length: 1000 }, () => parentContainer.createScope()),
  );
});
