import { assertEquals, assertInstanceOf } from 'jsr:@std/assert';
import { Container, Injectable } from '../src/Container.ts';

Deno.test('resolve all implementations of interface', () => {
  //Assign
  const IBarSymbol: unique symbol = Symbol('IBar');

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
  assertEquals(
    barInstances.length,
    2,
    'Should resolve to two instances of IBar implementations',
  );
  assertInstanceOf(
    barInstances[0],
    BarImpl1,
    'First instance should be of type BarImpl1',
  );
  assertInstanceOf(
    barInstances[1],
    BarImpl2,
    'Second instance should be of type BarImpl2',
  );
});

Deno.test('resolve all implementations of abstract class', () => {
  //Assign
  const BarSymbol: unique symbol = Symbol('Bar');
  abstract class Bar {}

  @Injectable(BarSymbol)
  class BarImpl1 extends Bar {}
  @Injectable(BarSymbol)
  class BarImpl2 extends Bar {}

  const container = new Container();
  container.register<Bar>(BarImpl1);
  container.register<Bar>(BarImpl2);

  //Act
  const barInstances = container.resolveAll(BarSymbol);

  //Assert
  assertEquals(
    barInstances.length,
    2,
    'Should resolve to two instances of IBar implementations',
  );
  assertInstanceOf(
    barInstances[0],
    BarImpl1,
    'First instance should be of type BarImpl1',
  );
  assertInstanceOf(
    barInstances[1],
    BarImpl2,
    'Second instance should be of type BarImpl2',
  );
});
