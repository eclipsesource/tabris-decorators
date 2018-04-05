import { Injection, Injector } from '../api/Injector';
import { applyDecorator, BaseConstructor, Constructor } from '../internals/utils';

export type IHFunction<T> = (injection: Injection) => T | void;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type InjectionHandlerDeco<T>
  = (target: BaseConstructor<any>, propertyName: string, descriptor: IHDescriptor<T>) => void;

export function injectionHandler<T>(targetType: BaseConstructor<T>): InjectionHandlerDeco<T>;
export function injectionHandler(this: Injector, ...args: any[]): any {
  return applyDecorator('injectionHandler', args, (target: object, targetProperty: string) => {
    let type = args[0] as Constructor<any>;
    if (target instanceof Function) {
      this.addHandler(type, (injection) => target[targetProperty](injection));
    } else {
      throw new Error('Decorator must be applied to a method');
    }
  });
}
