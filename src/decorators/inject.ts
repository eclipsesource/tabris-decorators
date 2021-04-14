import 'reflect-metadata';
import {Injector} from '../api/Injector';
import {applyDecorator, getOwnParamInfo, getParameterType, getPropertyInfo, Decorator, hasPropertyType, getPropertyType} from '../internals/utils';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';

export type InjectDecorator = typeof unboundInject;

export function bindDecoratorInject(injector: Injector): typeof unboundInject {
  return unboundInject.bind(injector);
}

// Remember to update index.ts when editing this JsDoc:
/**
 * A decorator that marks a constructor parameter for injections based on the type of the parameter:
 * ```
 * constructor(@inject a: ClassA) { ... }
 * ```
 * A parameter can be passed to the injector (see `@injectable` and `@injectionHandler`) like this:
 * ```
 * constructor(@inject('some value') a: ClassA) { ... }
 * ```
 */
export function unboundInject(param: string): Decorator<any>;
export function unboundInject(target: object, property: string, index?: number): void;
export function unboundInject(this: Injector, ...args: any[]): any {
  return applyDecorator('inject', args, (target, property, index) => {
    const param: string = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterInfo(target, index, param);
    } else if (!(target instanceof Function) && typeof property === 'string') {
      return injectProperty(target as object, property as keyof typeof target, param);
    } else {
      throw new Error('Invalid parameters');
    }
  });
}

function setParameterInfo(target: any, index: number, injectParam?: string) {
  getOwnParamInfo(target)[index] = {
    injectParam, type: getParameterType(target, index), inject: true
  };
}

function injectProperty<T extends object>(proto: T, property: string & keyof T, injectParam?: string) {
  if (!hasPropertyType(proto, property)) {
    throw new Error(
      'Property type is undefined. You may have a broken import, circular module dependencies or an incorrect tsconfig.json configuration.'
    );
  }
  const type = getPropertyType(proto, property);
  if (type === Object) {
    throw new Error('Property type could not be inferred. Only classes and primitive types are supported.');
  }
  CustomPropertyDescriptor.get(proto, property).addConfig({
    readonly: true,
    initializer(instance) {
      try {
        Injector.get(instance);
      } catch {
        throw new Error(
          `Can not inject "${property}" since ${instance.constructor.name} is not injectable.`
        );
      }
      return Injector.get(instance).resolve(type, injectParam || null);
    }
  });
  getPropertyInfo(proto as any, property).inject = true;
}
