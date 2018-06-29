import 'reflect-metadata';
import { Injection, InjectionParameter, Injector } from '../api/Injector';
import { applyClassDecorator, areStaticClassDecoratorArgs, BaseConstructor, ClassDecoratorFactory, Constructor } from '../internals/utils';

export type InjectableDecorator = typeof unboundInjectable;

export function bindDecoratorInjectable(injector: Injector): typeof unboundInjectable {
  return unboundInjectable.bind(injector);
}

// Remember to update index.ts when editing this JsDoc:
/**
 * A decorator that makes a class injectable via `@inject` or `resolve(type)`.
 * It can be injected as itself or as any of its super-classes:
 *
 * ```
 * ‍@injectable class Foo2 extends Foo { ... }
 * ```
 * A configuration object can be passed:
 * ```
 * ‍@injectable({opt: value})
 * class Foo2 extends Foo { ... }
 * ```
 * The object can have any of these entries:
 * - `shared: boolean`: when `true`this makes the class effectively a singleton
 * - `implements: OtherClass`: allows the class to be injected as `OtherClass`
 * - `param: value`: allows injection only when `@inject(param)` gives the exact same parameter value.
 */
export function unboundInjectable<T>(config: InjectableConfig<T>): ClassDecoratorFactory<T>;
export function unboundInjectable<T>(type: Constructor<T>): void;
export function unboundInjectable(this: Injector, ...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    let config = getInjectableConfig(args);
    let handler = new DefaultInjectionHandler(type, config);
    this.addHandler(type, handler.handleInjection);
    if (config.implements) {
      this.addHandler(config.implements, handler.handleInjection);
    }
  });
}

function getInjectableConfig(args: any[]): InjectableConfig<any> {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as InjectableConfig<any>;
  }
  return {};
}

class DefaultInjectionHandler<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private config: InjectableConfig<T> = {}) { }

  public handleInjection = (injection: Injection) => {
    if ('param' in this.config && injection.param !== this.config.param) {
      return null;
    }
    if (!this.config.shared) {
      return injection.injector.create(this.type);
    }
    if (!this.instance) {
      this.instance = injection.injector.create(this.type);
    }
    return this.instance;
  }

}

export interface InjectableConfig<T> {
  shared?: boolean;
  implements?: BaseConstructor<T>;
  param?: InjectionParameter;
}

const injectableKey = Symbol('injectable');
