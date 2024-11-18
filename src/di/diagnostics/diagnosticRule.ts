import {Constructor} from "../container.ts";
import {Reflect} from "jsr:@dx/reflect";

export abstract class DiagnosticRule {
    abstract name: string;
    abstract description: string;
    abstract Verify(): string[];

    protected getDependencies<T>(constructor: Constructor<T>): Constructor<unknown>[] {
        return Reflect.getMetadata("design:paramtypes", constructor) || [];
    }
}