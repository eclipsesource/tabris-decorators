import 'reflect-metadata';
import { Injection, InjectionHandlerObject, Injector } from './Injector';
import { applyClassDecorator, areStaticClassDecoratorArgs, BaseConstructor, ClassDecoratorFactory, Constructor } from './utils';

export function injectable<T>(config: InjectableConfig<T>): ClassDecoratorFactory<T>;
export function injectable<T>(type: Constructor<T>): void;
export function injectable(this: Injector, ...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    let config = getInjectableConfig(args);
    let handler = new DefaultInjectionHandler(type, config);
    this.addHandler(type, handler);
    if (config.implements) {
      this.addHandler(config.implements, handler);
    }
  });
}

export function shared(type: Constructor<any>): void;
export function shared(this: Injector, type: Constructor<any>): void {
  this.injectable({shared: true})(type);
}

function getInjectableConfig(args: any[]): InjectableConfig<any> {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as InjectableConfig<any>;
  }
  return {};
}

class DefaultInjectionHandler<T> implements InjectionHandlerObject<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private config: InjectableConfig<T> = {}) { }

  public handleInjection({injector}: Injection) {
    if (!this.config.shared) {
      return injector.create(this.type);
    }
    if (!this.instance) {
      this.instance = injector.create(this.type);
    }
    return this.instance;
  }

}

export interface InjectableConfig<T> {
  shared?: boolean;
  implements?: BaseConstructor<T>;
}

const injectableKey = Symbol('injectable');
