import { Container, Injectable, LifeStyles } from "../src/Container.ts";


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


Deno.bench("stress test for Transient services",{group: "LifeStyles Transient vs Singleton"}, () => {
    transientContainer.resolve(Foo);
});

const singletonContainer = new Container();
singletonContainer.register(Buzz, LifeStyles.Singleton);
singletonContainer.register(Foo, LifeStyles.Singleton);
singletonContainer.register(Bah, LifeStyles.Singleton);
singletonContainer.register(Bar, LifeStyles.Singleton);
singletonContainer.register(Baz, LifeStyles.Singleton);
singletonContainer.register(Qux, LifeStyles.Singleton);

Deno.bench("stress test for Singleton services", {group: "LifeStyles Transient vs Singleton"},  () => {
    singletonContainer.resolve(Foo);
});

const parentContainer = new Container();
parentContainer.register(Buzz, LifeStyles.Scoped);
parentContainer.register(Foo, LifeStyles.Scoped);
parentContainer.register(Bah, LifeStyles.Scoped);
parentContainer.register(Bar, LifeStyles.Scoped);
parentContainer.register(Baz, LifeStyles.Scoped);
parentContainer.register(Qux, LifeStyles.Scoped);

Deno.bench("stress test for Scoped services from parent container",{group: "parent vs scoped container"},  () => {
    parentContainer.resolve(Foo);
});

const scopedContainer = parentContainer.createScope();
Deno.bench("stress test for Scoped services from parent container",{group: "parent vs scoped container"},  () => {
    scopedContainer.resolve(Foo);
});

Deno.bench("stress test for creating container",  () => {
    new Container();
});

Deno.bench("stress test for creating scoped container",  () => {
    parentContainer.createScope();
});





