import 'reflect-metadata';
import { Injector } from './Injector';
import {
  getParameterType,
  applyDecorator,
  getParamInfo,
  Constructor,
  ParameterDecoratorFactory
} from './utils';

export function inject(constructor: Constructor<any>, property: string, index: number): void;
export function inject(param: string): ParameterDecoratorFactory;
export function inject(this: Injector, ...args: any[]): any {
  return applyDecorator('inject', args, (target, property, index) => {
    const param: string = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      return setParameterInfo(target, index, this, param);
    } else {
      throw new Error('@inject can only be applied to constructor parameters');
    }
  });
}

function setParameterInfo(target: any, index: number, injector: Injector, injectParam?: string) {
  getParamInfo(target)[index] = {
    injectParam, injector, type: getParameterType(target, index)
  };
}
