import 'reflect-metadata';
import {instance as injectionManager} from './Injector';
import {Constructor, applyClassDecorator, ClassDecoratorFactory} from './utils';

const sharedKey = Symbol('shared');
const injectableKey = Symbol('injectable');

export default function injectable(type: Constructor<any>): void;
export default function injectable(...args: any[]): ClassDecoratorFactory | void {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    Reflect.defineMetadata(injectableKey, true, type);
    let isShared = Reflect.getOwnMetadata(sharedKey, type);
    let injectionHandler = isShared ? createSharedInjectionHandler(type) : createDefaultInjectionHandler(type);
    injectionManager.addHandler(type, injectionHandler);
  });
}

export function shared(type: Constructor<any>): void {
  if (Reflect.getOwnMetadata(injectableKey, type)) {
    throw new Error('@shared must be defined before @injectable');
  }
  Reflect.defineMetadata(sharedKey, true, type);
}

function createSharedInjectionHandler<T>(type: Constructor<T>) {
  let instance: T;
  return () => {
    if (instance === undefined) {
      instance = injectionManager.create(type);
    }
    return instance;
  };
}

function createDefaultInjectionHandler(type: Constructor<any>) {
  return () => injectionManager.create(type);
}
