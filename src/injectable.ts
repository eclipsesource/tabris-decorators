import 'reflect-metadata';
import {instance as injectionManager, InjectionHandler, Injection} from './Injector';
import {Constructor, applyClassDecorator, areStaticClassDecoratorArgs, ClassDecoratorFactory} from './utils';

export default function injectable(shared: boolean): ClassDecoratorFactory<any>;
export default function injectable(type: Constructor<any>): void;
export default function injectable(...args: any[]): void | ClassDecoratorFactory<any> {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    let isShared = getShared(args);
    injectionManager.addHandler(type, new DefaultInjectionHandler(type, isShared));
  });
}

function getShared(args: any[]) {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as boolean;
  }
  return false;
}

const injectableKey = Symbol('injectable');

class DefaultInjectionHandler<T> implements InjectionHandler<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private isShared: boolean) { }

  public handleInjection(injection: Injection) {
    if (!this.isShared) {
      return injectionManager.create(this.type);
    }
    if (!this.instance) {
      this.instance = injectionManager.create(this.type);
    }
    return this.instance;
  }

}
