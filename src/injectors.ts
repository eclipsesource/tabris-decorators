import 'reflect-metadata';
import {Constructor} from './InjectionHandlerCollection';
import {injectionHandlers} from '.';
import {
  DecoratorFactory,
  defineGetter,
  getPropertyType,
  areStaticDecoratorArgs,
  applyPropertyDecorator,
  getPropertyStore
} from './utils';

export function inject<T>(type: Constructor<T>, param?: string): T;
export function inject(targetProto: object, property: string): void;
export function inject(param: string): DecoratorFactory;
export function inject(...args: any[]): any {
  if (args[0] instanceof Function) {
    return directInject(args[0], args[1]);
  }
  return applyInjectDecorator(args);
}

function directInject<T>(type: Constructor<T>, param?: string): T {
  return getUnboxer(type)(injectionHandlers.resolve(type, param));
}

function applyInjectDecorator(args: any[]): DecoratorFactory | void {
  return applyPropertyDecorator('inject', args, (proto, property) => {
    const type = getPropertyType(proto, property);
    if (!type) {
      throw new Error('Type could not be inferred. Only classes and primitive types are supported.');
    }
    const unboxer = getUnboxer(type);
    const param = typeof args[0] === 'string' ? args[0] : undefined;
    defineGetter(proto, property, function(this: object) {
      try {
        let store = getPropertyStore(this);
        if (!store.has(property)) {
          store.set(property, unboxer(injectionHandlers.resolve(type, param)));
        }
        return store.get(property);
      } catch (ex) {
        throw new Error(`Decorator "inject" could not resolve property "${property}": ${ex.message}`);
      }
    });
  });
}

function getUnboxer(type: any) {
  if (type === Number || type === String || type === Boolean) {
    return unboxValue;
  }
  return passValue;
}

function passValue(value: any) {
  return value;
}

function unboxValue(box: any) {
  return box.valueOf();
}
