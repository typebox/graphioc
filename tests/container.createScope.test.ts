import {
    assert,
    assertEquals,
    assertInstanceOf
} from "jsr:@std/assert";
import {Container, Injectable, LifeStyles} from "../src/di/container.ts";

Deno.test("Scoped Container and parent container are different", () => {
    //Assign
    const container = new Container();

    //Act
    const scopedContainer = container.createScope();

    //Assert
    assert(scopedContainer !== container, "Transient should return different instances");
});

Deno.test("Singleton registration and resolution same instance between parent and scoped container", () => {
    //Assign
    @Injectable()
    class Bar {}

    const container = new Container();
    container.register(Bar,LifeStyles.Singleton);

    const scopedContainer = container.createScope();

    //Act
    const barInstance1 = container.resolve(Bar);
    const barInstance2 = scopedContainer.resolve(Bar);

    //Assert
    assertEquals(barInstance1, barInstance2, "Singleton should return the same instance");
    assertInstanceOf(barInstance1, Bar, "Resolved instance should be of type Bar");
});

Deno.test("Scoped registration and resolution different instance between parent and scoped container", () => {
    //Assign
    @Injectable()
    class Bar {}

    const container = new Container();
    container.register(Bar,LifeStyles.Scoped);

    const scopedContainer = container.createScope();

    //Act
    const barInstance_container = container.resolve(Bar);
    const barInstance_scopedContainer = scopedContainer.resolve(Bar);

    //Assert
    assert(barInstance_container !== barInstance_scopedContainer, "Scoped should return different instances between containers");
    assertInstanceOf(barInstance_container, Bar, "Resolved instance from parent container should be of type Bar");
    assertInstanceOf(barInstance_scopedContainer, Bar, "Resolved instance from scoped container should be of type Bar");
});

Deno.test("Scoped registration should be act as Singleton within container but not between them", () => {
    //Assign
    @Injectable()
    class Bar {}

    const container = new Container();
    container.register(Bar,LifeStyles.Scoped);

    const scopedContainer = container.createScope();

    //Act
    const barInstance_container1 = container.resolve(Bar);
    const barInstance_container2 = container.resolve(Bar);
    const barInstance_scopedContainer1 = scopedContainer.resolve(Bar);
    const barInstance_scopedContainer2 = scopedContainer.resolve(Bar);

    //Assert
    assert(barInstance_container1 === barInstance_container2, "Scoped should return the same instance from parent container");
    assert(barInstance_scopedContainer1 === barInstance_scopedContainer2, "Scoped should return the same instance from parent scoped container");
    assert(barInstance_container1 !== barInstance_scopedContainer1, "Scoped should return different instance from parent container");
    assert(barInstance_container2 !== barInstance_scopedContainer2, "Scoped should return different instance from parent scoped container");
});