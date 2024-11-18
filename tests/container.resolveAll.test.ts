import {
    assertEquals,
    assertInstanceOf
} from "jsr:@std/assert";
import {Container, Injectable} from "../src/di/container.ts";

Deno.test("resolve all implementations", () => {
    //Assign
    const IBarSymbol: unique symbol = Symbol("IBar");

    // deno-lint-ignore no-empty-interface
    interface IBar {}

    @Injectable(IBarSymbol)
    class BarImpl1 implements IBar {}
    @Injectable(IBarSymbol)
    class BarImpl2 implements IBar {}

    const container = new Container();
    container.register<IBar>(BarImpl1);
    container.register<IBar>(BarImpl2);

    //Act
    const barInstances = container.resolveAll<IBar>(IBarSymbol);

    //Assert
    assertEquals(barInstances.length, 2, "Should resolve to two instances of IBar implementations");
    assertInstanceOf(barInstances[0], BarImpl1, "First instance should be of type BarImpl1");
    assertInstanceOf(barInstances[1], BarImpl2, "Second instance should be of type BarImpl2");
});