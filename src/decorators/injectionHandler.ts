import { Injection, Injector } from '../api/Injector';
import { applyDecorator, BaseConstructor, Constructor } from '../internals/utils';

export type IHFunction<T> = (injection: Injection) => T | void;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type InjectionHandlerDeco<T>
  = (target: BaseConstructor<any>, propertyName: string, descriptor: IHDescriptor<T>) => void;

export function bindDecoratorInjectionHandler(injector: Injector): typeof unboundInjectionHandler {
  return unboundInjectionHandler.bind(injector);
}

// Remember to update index.ts when editing this JsDoc:
/**
 * Registers a static method to handle injections for the given type:
 * ```
 * ‍@injectionHandler(MyServiceClass)
 * public static createMyServiceClass(injection: Injection) {
 *   return new MyServiceClass(someArg);
 * }
 * ```
 * The method must return a value compatible to the given type or `null`/`undefined`.
 * The method is passed an `Injection` object with the following fields:
 * - `type`: The exact type that was requested.
 * - `injector`: The `Injector` instance the injection handler is registered with.
 * - `param`: An injection parameter that may have been passed via `@inject(param)` or `resolve(type, param)`
 */
export function unboundInjectionHandler<T>(targetType: BaseConstructor<T>): InjectionHandlerDeco<T>;
export function unboundInjectionHandler(this: Injector, ...args: any[]): any {
  return applyDecorator('injectionHandler', args, (target: object, targetProperty: string) => {
    let type = args[0] as Constructor<any>;
    if (target instanceof Function) {
      this.addHandler(type, (injection) => target[targetProperty](injection));
    } else {
      throw new Error('Decorator must be applied to a method');
    }
  });
}
