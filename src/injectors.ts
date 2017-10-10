import 'reflect-metadata';
import {injectionHandlers} from '.';
import {
  DecoratorFactory,
  defineGetter,
  getPropertyType,
  getParameterType,
  applyDecorator,
  getPropertyStore,
  getParamConfig,
  Constructor
} from './utils';

export function create<T, U, V, W>(
  type: {new(arg1?: U, arg2?: V, arg3?: W, ...args: any[]): T; },
  args: {0?: U, 1?: V, 2?: W, [index: number]: any}
): T {
  let finalArgs: any[] = [];
  let config = getParamConfig(type) || [];
  for (let i = 0; i < type.length; i++) {
    finalArgs[i] = config[i] ? inject(config[i].type, config[i].injectParam) : args[i];
  }
  return new type(...finalArgs);
}

export function inject<T>(type: Constructor<T>, param?: string): T;
export function inject(targetProto: object, property: string): void;
export function inject(constructor: Constructor<any>, property: string, index: number): void;
export function inject(param: string): DecoratorFactory;
export function inject(...args: any[]): any {
  if (args[0] instanceof Function && args.length <= 2) {
    return directInject(args[0], args[1]);
  }
  return applyInjectDecorator(args);
}

function directInject<T>(type: Constructor<T>, param?: string): T {
  return getUnboxer(type)(injectionHandlers.resolve(type, param));
}

function applyInjectDecorator(args: any[]): DecoratorFactory | void {
  return applyDecorator('inject', args, (target, property, index) => {
    const param = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterConfig(target, index, param);
    }
    const type = getPropertyType(target, property);
    const unboxer = getUnboxer(type);
    defineGetter(target, property, function(this: object) {
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

function setParameterConfig(target: any, index: number, injectParam?: string) {
  getParamConfig(target)[index] = {
    injectParam, type: getParameterType(target, index)
  };
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
