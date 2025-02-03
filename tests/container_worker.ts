import { Container, Injectable, LifeStyles } from "../src/Container.ts";

@Injectable()
class Foo {}

const container = new Container();
container.register(Foo, LifeStyles.Transient);

self.onmessage = () => {
  container.resolve(Foo); // Simulate resolution
  self.postMessage("done");
};
