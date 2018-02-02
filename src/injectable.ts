import 'reflect-metadata';
import { instance as injector } from './Injector';
import { InjectableConfig } from './DefaultInjectionHandler';
import { Constructor, applyClassDecorator, areStaticClassDecoratorArgs, ClassDecoratorFactory } from './utils';

export default function injectable(config: InjectableConfig): ClassDecoratorFactory<any>;
export default function injectable(type: Constructor<any>): void;
export default function injectable(...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    injector.addInjectable(type, getInjectableConfig(args));
  });
}

export function shared(type: Constructor<any>): void {
  injectable({shared: true})(type);
}

function getInjectableConfig(args: any[]): InjectableConfig {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as InjectableConfig;
  }
  return {};
}

const injectableKey = Symbol('injectable');
