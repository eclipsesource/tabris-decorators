import 'reflect-metadata';
import {instance as injectionManager, InjectionHandler, Injection} from './Injector';
import {Constructor, applyClassDecorator} from './utils';

const sharedKey = Symbol('shared');
const injectableKey = Symbol('injectable');

export default function injectable(type: Constructor<any>): void;
export default function injectable(...args: any[]): void {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    let isShared = Reflect.getOwnMetadata(sharedKey, type);
    injectionManager.addHandler(type, new DefaultInjectionHandler(type, isShared));
  });
}

export function shared(type: Constructor<any>): void {
  if (Reflect.getOwnMetadata(injectableKey, type)) {
    throw new Error('@shared must be defined before @injectable');
  }
  Reflect.defineMetadata(sharedKey, true, type);
}

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
