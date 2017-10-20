import 'reflect-metadata';
import { instance as injectionManager } from './InjectionManager';
import {
  DecoratorFactory,
  getPropertyType,
  getParameterType,
  applyDecorator,
  getParamInfo,
  Constructor,
  defineGetter,
  getPropertyStore
} from './utils';

export default function inject(targetProto: object, property: string): void;
export default function inject(constructor: Constructor<any>, property: string, index: number): void;
export default function inject(param: string): DecoratorFactory;
export default function inject(...args: any[]): any {
  if (args[0] instanceof Function && args.length <= 2) {
    return directInject(args[0], args[1]);
  }
  return applyInjectDecorator(args);
}

function directInject<T>(type: Constructor<T>, param?: string): T {
  return injectionManager.resolve(type, param);
}

function applyInjectDecorator(args: any[]): DecoratorFactory | void {
  return applyDecorator('inject', args, (target, property, index) => {
    const param = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterInfo(target, index, param);
    }
    const type = getPropertyType(target, property);
    defineGetter(target, property, function(this: object) {
      try {
        let store = getPropertyStore(this);
        if (!store.has(property)) {
          store.set(property, injectionManager.resolve(type, param));
        }
        return store.get(property);
      } catch (ex) {
        throw new Error(`Decorator "inject" could not resolve property "${property}": ${ex.message}`);
      }
    });
  });
}
function setParameterInfo(target: any, index: number, injectParam?: string) {
  getParamInfo(target)[index] = {
    injectParam, type: getParameterType(target, index)
  };
}
