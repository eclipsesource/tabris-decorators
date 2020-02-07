import {Injection, Injector} from '../api/Injector';
import {applyDecorator, BaseConstructor, Constructor} from '../internals/utils';

export type IHFunction<T> = (injection: Injection) => T | void;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type CoreInjectionHandlerDecorator<T>
  = (target: BaseConstructor<any>, propertyName: string, descriptor: IHDescriptor<T>) => void;

export type InjectionHandlerDecorator = typeof unboundInjectionHandler;

export function bindDecoratorInjectionHandler(injector: Injector): typeof unboundInjectionHandler {
  return unboundInjectionHandler.bind(injector);
}

// Remember to update index.ts when editing this JsDoc:
/**
 * Registers a static method to handle injections for the given type:
 * ```
 * ‍@injectionHandler(MyServiceClass)
 * static createMyServiceClass(injection: Injection) {
 *   return new MyServiceClass(someArg);
 * }
 * ```
 * A priority may also be given, defaults to 0:
 * ```ts
 * @injectionHandler({targetType: MyServiceClass, priority: 2})
 * ```
 *
 * The decorated method must return a value compatible to the given type or `null`/`undefined`.
 * The method is passed an `Injection` object with the following fields:
 * - `type`: The exact type that was requested.
 * - `injector`: The `Injector` instance the injection handler is registered with.
 * - `param`: An injection parameter that may have been passed via `@inject(param)` or `resolve(type, param)`
 */
export function unboundInjectionHandler<T>(targetType: BaseConstructor<T>): CoreInjectionHandlerDecorator<T>;
export function unboundInjectionHandler<T>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  param: {targetType: BaseConstructor<T>, priority?: number}
): CoreInjectionHandlerDecorator<T>;
export function unboundInjectionHandler(this: Injector, ...args: any[]): any {
  return applyDecorator('injectionHandler', args, (target: object, targetProperty: string) => {
    if (target instanceof Function) {
      const targetType = (args[0] instanceof Function ? args[0] : args[0].targetType) as Constructor<any>;
      const priority = (args[0] instanceof Function ? 0 : args[0].priority) || 0;
      const handler = (injection) => target[targetProperty](injection);
      this.addHandler({targetType, handler, priority});
    } else {
      throw new Error('Decorator must be applied to a method');
    }
  });
}
