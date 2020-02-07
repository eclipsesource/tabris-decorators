import 'reflect-metadata';
import {Injector} from '../api/Injector';
import {applyDecorator, Constructor, getOwnParamInfo, getParameterType, ParameterDecoratorFactory} from '../internals/utils';

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
export function unboundInject(param: string): ParameterDecoratorFactory;
export function unboundInject(constructor: Constructor<any>, property: string, index: number): void;
export function unboundInject(this: Injector, ...args: any[]): any {
  return applyDecorator('inject', args, (target, property, index) => {
    const param: string = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterInfo(target, index, param);
    } else {
      throw new Error('@inject can only be applied to constructor parameters');
    }
  });
}

function setParameterInfo(target: any, index: number, injectParam?: string) {
  getOwnParamInfo(target)[index] = {
    injectParam, type: getParameterType(target, index), inject: true
  };
}
