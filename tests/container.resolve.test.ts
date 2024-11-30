import { assertInstanceOf, assertThrows, assert } from "jsr:@std/assert";
import { Container, Injectable, LifeStyles } from "../src/Container.ts";


Deno.test("singleton registration and resolution", () => {

    //Assign
    @Injectable()
    class Bar {}

    const container = new Container();
    container.register(Bar,LifeStyles.Singleton);

    //Act
    const barInstance1 = container.resolve(Bar);
    const barInstance2 = container.resolve(Bar);


    //Assert
    assert(barInstance1 === barInstance2, "Singleton should return the same instance");
    assertInstanceOf(barInstance1, Bar, "Resolved instance should be of type Bar");
});

Deno.test("transient registration and resolution", () => {
    // Assign
    @Injectable()
    class Foo {}

    const container = new Container();
    container.register(Foo);

    //Act
    const fooInstance1 = container.resolve(Foo);
    const fooInstance2 = container.resolve(Foo);

    //Assert
    assert(fooInstance1 !== fooInstance2, "Transient should return different instances");
    assertInstanceOf(fooInstance1, Foo, "Resolved instance should be of type Foo");
    assertInstanceOf(fooInstance2, Foo, "Resolved instance should be of type Foo");
});

Deno.test("unregistered service resolution", () => {

    // Assign
    @Injectable()
    class Foo {}

    //Act
    const container = new Container();

    //Assert
    assertThrows(
        () => {
            container.resolve(Foo);
        },
        Error,
        "Service not registered: Foo",
        "Should throw an error when resolving an unregistered service"
    );
});

Deno.test("automatic dependency resolution", () => {
    //Assign
    @Injectable()
    class Foo {}
    @Injectable()
    class Bah {
        constructor(public foo: Foo) {}
    }

    const container = new Container();
    container.register(Foo, LifeStyles.Transient);
    container.register(Bah, LifeStyles.Transient);

    //Act
    const bazInstance = container.resolve(Bah);

    //Assert
    assertInstanceOf(bazInstance, Bah, "Resolved instance should be of type Bah");
    assertInstanceOf(bazInstance.foo, Foo, "Bah should have a dependency of type Foo resolved automatically");
});

Deno.test("automatic dependency resolution of deep graph", () => {
    // Assign
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

    // Instantiate the container and register classes
    const container = new Container();
    container.register(Buzz, LifeStyles.Transient);
    container.register(Foo, LifeStyles.Transient);
    container.register(Bah, LifeStyles.Transient);
    container.register(Bar, LifeStyles.Transient);
    container.register(Baz, LifeStyles.Transient);
    container.register(Qux, LifeStyles.Transient);

    // Act
    const quxInstance = container.resolve(Qux);

    // Assertions
    assertInstanceOf(quxInstance, Qux, "Resolved instance should be of type Qux");
    assertInstanceOf(quxInstance.baz, Baz, "Qux should have a dependency of type Baz resolved automatically");
    assertInstanceOf(quxInstance.baz.bar, Bar, "Baz should have a dependency of type Bar resolved automatically");
    assertInstanceOf(quxInstance.baz.bar.bah, Bah, "Bar should have a dependency of type Bah resolved automatically");
    assertInstanceOf(quxInstance.baz.bar.bah.foo, Foo, "Bah should have a dependency of type Foo resolved automatically");
    assertInstanceOf(quxInstance.baz.bar.bah.foo.buzz, Buzz, "Foo should have a dependency of type Buzz resolved automatically");
});