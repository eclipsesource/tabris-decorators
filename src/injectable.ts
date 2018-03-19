import 'reflect-metadata';
import { Injector } from './Injector';
import { InjectableConfig } from './DefaultInjectionHandler';
import { Constructor, applyClassDecorator, areStaticClassDecoratorArgs, ClassDecoratorFactory } from './utils';

export function injectable(config: InjectableConfig): ClassDecoratorFactory<any>;
export function injectable(type: Constructor<any>): void;
export function injectable(this: Injector, ...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    this.addInjectable(type, getInjectableConfig(args));
  });
}

export function shared(this: Injector, type: Constructor<any>): void {
  this.injectable({shared: true})(type);
}

function getInjectableConfig(args: any[]): InjectableConfig {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as InjectableConfig;
  }
  return {};
}

const injectableKey = Symbol('injectable');
