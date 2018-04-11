import 'reflect-metadata';
import { Injector } from '../api/Injector';
import { applyDecorator, Constructor, getParameterType, getParamInfo, ParameterDecoratorFactory } from '../internals/utils';

export function bindDecoratorInject(injector: Injector): typeof unboundInject {
  return unboundInject.bind(injector);
}

export function unboundInject(constructor: Constructor<any>, property: string, index: number): void;
export function unboundInject(param: string): ParameterDecoratorFactory;
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
  getParamInfo(target)[index] = {
    injectParam, type: getParameterType(target, index), inject: true
  };
}
