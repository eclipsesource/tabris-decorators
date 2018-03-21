import 'reflect-metadata';
import { Injection, InjectionHandlerObject, Injector } from './Injector';
import { applyClassDecorator, areStaticClassDecoratorArgs, ClassDecoratorFactory, Constructor } from './utils';

export function injectable(config: InjectableConfig): ClassDecoratorFactory<any>;
export function injectable(type: Constructor<any>): void;
export function injectable(this: Injector, ...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    this.addHandler(type, new DefaultInjectionHandler(type, getInjectableConfig(args)));  });
}

export function shared(type: Constructor<any>): void;
export function shared(this: Injector, type: Constructor<any>): void {
  this.injectable({shared: true})(type);
}

function getInjectableConfig(args: any[]): InjectableConfig {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as InjectableConfig;
  }
  return {};
}

class DefaultInjectionHandler<T> implements InjectionHandlerObject<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private config: InjectableConfig = {}) { }

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

export interface InjectableConfig {
  shared?: boolean;
}

const injectableKey = Symbol('injectable');
