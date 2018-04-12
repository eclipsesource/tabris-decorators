import { Injection, injector } from './api/Injector';
import { InjectableConfig } from './decorators/injectable';
import { Constructor } from './internals/utils';

// NOTE: The JsDoc for decorators in this file are necessary duplicates from those attached to the implementation.
// Those here are displayed in VS code when using the decorator without parameters.

export * from './decorators/component';
export * from './decorators/property';
export * from './decorators/bind';
export * from './decorators/getById';
export * from './decorators/event';
export * from './api/checkType';
export * from './api/Injector';
export * from './api/interfaces';
export * from './api/Listeners';

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
export const inject = injector.inject;

/**
 * A decorator that makes a class injectable via `@inject` or `resolve(type)`.
 * It can be injected as itself or as any of its super-classes:
 *
 * ```
 * ‍@injectable class Foo2 extends Foo { ... }
 * ```
 * A configuration object can be passed:
 * ```
 * ‍@injectable({opt: value})
 * class Foo2 extends Foo { ... }
 * ```
 * The object can have any of these entries:
 * - `shared: boolean`: when `true`this makes the class effectively a singleton
 * - `implements: OtherClass`: allows the class to be injected as `OtherClass`
 * - `param: value`: allows injection only when `@inject(param)` gives the exact same parameter value.
 */
export const injectable = injector.injectable;

/**
 * Shorthand for `@injectable({shared: true})`.
 */
export const shared = injector.shared;

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
export const injectionHandler = injector.injectionHandler;

export const create = injector.create;
export const resolve = injector.resolve;

(JSX as any) = injector.JSX;
