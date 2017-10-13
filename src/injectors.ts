import 'reflect-metadata';
import {
  DecoratorFactory,
  getPropertyType,
  getParameterType,
  applyDecorator,
  getParamInfo,
  Constructor,
  getPropertyInfo
} from './utils';

export function inject(targetProto: object, property: string): void;
export function inject(constructor: Constructor<any>, property: string, index: number): void;
export function inject(param: string): DecoratorFactory;
export function inject(...args: any[]): any {
  return applyInjectDecorator(args);
}

function applyInjectDecorator(args: any[]): DecoratorFactory | void {
  return applyDecorator('inject', args, (target, property, index) => {
    const param = typeof args[0] === 'string' ? args[0] : undefined;
    if (typeof index === 'number') {
      setParameterInfo(target, index, param);
    } else {
      setPropertyInfo(target, property, param);
    }
  });
}

function setParameterInfo(target: any, index: number, injectParam?: string) {
  getParamInfo(target)[index] = {
    injectParam, type: getParameterType(target, index)
  };
}

function setPropertyInfo(target: any, name: string, injectParam?: string) {
  getPropertyInfo(target).set(name, {injectParam, type: getPropertyType(target, name)});
}
