import { assert, assertEquals } from "jsr:@std/assert";
import { Container, Injectable, LifeStyles } from "../src/Container.ts";

Deno.test("Singleton instance should be disposed when container is disposed", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Singleton);

  const instance = container.resolve(DisposableService);

  // Act
  container.dispose();

  // Assert
  assertEquals(disposeCalled, 1, "Singleton should be disposed once");
});

Deno.test("Scoped instance should be disposed when scoped container is disposed", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Scoped);

  const scopedContainer = container.createScope();
  const instance = scopedContainer.resolve(DisposableService);

  // Act
  scopedContainer.dispose();

  // Assert
  assertEquals(disposeCalled, 1, "Scoped instance should be disposed once");
});

Deno.test("Scoped instances should dispose when parent container disposes", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Scoped);

  const scopedContainer = container.createScope();
  const instance = scopedContainer.resolve(DisposableService);

  // Act
  container.dispose();

  // Assert
  assertEquals(
    disposeCalled,
    1,
    "Scoped instance should be disposed when parent container disposes",
  );
});

Deno.test("Transient instances should not be stored and thus should not be disposed", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Transient);

  // Act
  const instance1 = container.resolve(DisposableService);
  const instance2 = container.resolve(DisposableService);
  container.dispose();

  // Assert
  assertEquals(
    disposeCalled,
    0,
    "Transient instances should not be disposed since they are not stored",
  );
});

Deno.test("Disposing twice should not call Symbol.dispose multiple times", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Singleton);

  container.resolve(DisposableService);

  // Act
  container.dispose();
  container.dispose(); // Calling twice

  // Assert
  assertEquals(disposeCalled, 1, "Dispose should be called only once");
});

Deno.test("Scoped instances should not be reused after scoped container disposal", () => {
  // Arrange
  let disposeCalled = 0;

  @Injectable()
  class DisposableService {
    [Symbol.dispose]() {
      disposeCalled++;
    }
  }

  const container = new Container();
  container.register(DisposableService, LifeStyles.Scoped);

  const scopedContainer1 = container.createScope();
  const instance1 = scopedContainer1.resolve(DisposableService);

  // Act
  scopedContainer1.dispose();

  const scopedContainer2 = container.createScope();
  const instance2 = scopedContainer2.resolve(DisposableService);

  // Assert
  assert(instance1 !== instance2, "New scoped instance should be created");
  assertEquals(disposeCalled, 1, "First scoped instance should be disposed");
});
