import 'reflect-metadata';
import { instance as injectionManager } from './Injector';
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
  return applyDecorator('inject', args, (target, property, index) => {
    const param: string = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterInfo(target, index, param);
    }
    const type = getPropertyType(target, property);
    if (type === Object) {
      throw new Error('Property type could not be inferred. Only classes and primitive types are supported.');
    }
    defineGetter(target, property, function(this: object) {
      try {
        let store = getPropertyStore(this);
        if (!store.has(property)) {
          let injection = {param, name: property, instance: this};
          store.set(property, injectionManager.resolve(type, injection));
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
