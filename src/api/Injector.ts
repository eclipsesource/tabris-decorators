import {bindDecoratorInject, InjectDecorator} from '../decorators/inject';
import {bindDecoratorInjectable, InjectableDecorator, injectableKey} from '../decorators/injectable';
import {bindDecoratorInjectionHandler, InjectionHandlerDecorator} from '../decorators/injectionHandler';
import {bindDecoratorShared, SharedDecorator} from '../decorators/shared';
import {ExtendedJSX} from '../internals/ExtendedJSX';
import {BaseConstructor, getParamInfo, getCustomProperties} from '../internals/utils';

export type InjectionParameter = object | string | number | boolean | null;
export type CreateFunction = typeof Injector.prototype.create;
export type ResolveFunction = typeof Injector.prototype.resolve;
export type RegisterFunction = typeof Injector.prototype.register;

export interface HandlerRegistration<Type, Result extends Type> {
  targetType: BaseConstructor<Type>;
  handler: InjectionHandlerFunction<Result>;
  priority?: number;
}

export interface Injection {
  type: BaseConstructor<any>;
  param: InjectionParameter;
  injector: Injector;
}

export type InjectionHandlerFunction<T> = (injection: Injection) => T | null | undefined;
const injectorKey = Symbol('injectorKey');

/**
 * An `Injector` instance manages injection handlers and fulfills injections.
 *
 * You may create your own instance of `Injector` if you wish to keep your injection
 * handlers separate from those kept in the global `injector` object exported
 * by `tabris-decorators`. You must then use the attached decorators and `JSX` object
 * instead of the global ones.
 */
export class Injector {

  /**
   * Returns the instance of Injector that was used to create the given object.
   * Given a class decorated with @inject or @shared it returns the injector
   * associated with these.
   */
  static get(object: object, fallback?: Injector): Injector {
    if (!object || !(object instanceof Object)) {
      throw new Error('Injector.get does not accept values of type ' + typeof object);
    }
    if (injectorKey in object) {
      return object[injectorKey];
    }
    if (Reflect.getMetadata(injectableKey, object)) {
      return Reflect.getMetadata(injectableKey, object);
    }
    if (fallback) {
      return fallback;
    }
    if (object instanceof Function && object.prototype instanceof Object && object.prototype.constructor !== Object) {
      throw new Error('Can not get injector for a class that is not decorated with @injectable');
    }
    throw new Error('Object was not created by an Injector');
  }

  readonly injectionHandler: InjectionHandlerDecorator = bindDecoratorInjectionHandler(this);
  readonly inject: InjectDecorator = bindDecoratorInject(this);
  readonly injectable: InjectableDecorator = bindDecoratorInjectable(this);
  readonly shared: SharedDecorator = bindDecoratorShared(this);

  /**
   * This object needs to be present in the module namespace to allow JSX expressions that
   * use this `Injector` instance to fulfill injections. E.g.
   * ```
   *   const JSX = injector.jsxProcessor; // shadows global JSX object
   * ```
   * Or to set it as the default for all JSX elements globally:
   * ```
   *   JSX.install(injector.jsxProcessor);
   * ```
   */
  readonly jsxProcessor: ExtendedJSX = new ExtendedJSX(this);

  private handlers: HandlersMap = new Map();
  private injectionStack: Array<BaseConstructor<any>> = [];
  private resolveQueue: unknown[] = [];

  /**
   * Registers a value as a shared injectable for the given type.
   * Equivalent to calling `addHandler(type, () => value)` or using
   * `@shared`.
   */
  register = <T, U extends T>(targetType: BaseConstructor<T>, value: U): U => {
    this.addHandler(targetType, () => value);
    return value;
  };

  /**
   * Explicitly registers a new injection handler. Same as using the attached `injectionHandler`
   * decorator.
   */
  addHandler: {
    <T, U extends T>(targetType: BaseConstructor<T>, handler: InjectionHandlerFunction<U>): void,
    <T, U extends T>(param: HandlerRegistration<T, U>): void
  } = <T, U extends T>(arg1: HandlerRegistration<T, U> | BaseConstructor<T>, arg2?: InjectionHandlerFunction<U>) => {
    const param = (arg1 instanceof Function ? {targetType: arg1, handler: arg2} : arg1) as HandlerRegistration<T, U>;
    if (!param.targetType || !param.handler) {
      throw new Error('invalid argument');
    }
    this.forEachPrototype(param.targetType, (prototype: object) => {
      const targetTypeHandlers = this.handlers.get(prototype) || [];
      const ref = targetTypeHandlers.findIndex(reg => (reg.priority || 0) <= (param.priority || 0));
      targetTypeHandlers.splice(ref < 0 ? targetTypeHandlers.length : ref, 0, param);
      this.handlers.set(prototype, targetTypeHandlers);
    });
  };

  /**
   * Returns an instance for an injectable type, just like using the `@inject` decorator
   * would do in a constructor.
   */
  resolve = <T>(type: BaseConstructor<T>, param: InjectionParameter = null): T => {
    const regs = this.findHandlerRegistrations(type);
    if (!regs.length) {
      if (type === (Injector as any)) {
        return this as any;
      }
      throw new Error(
        `Could not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    if (this.injectionStack.indexOf(type) !== -1) {
      const stackString = this.injectionStack.concat(type).map(constructor => constructor.name).join(' -> ');
      throw new Error('Circular dependency injection: ' + stackString);
    }
    const unbox = this.getUnboxer(type);
    for (const reg of regs) {
      this.injectionStack.push(type);
      let result: T = null;
      try {
        result = unbox(reg.handler({type, injector: this, param}));
      } finally {
        this.injectionStack.pop();
        if (!result) {
          this.resolveQueue = [];
        }
      }
      this.scheduleResolveProperties(result);
      this.resolvePropertyInjections();
      if (result !== null && result !== undefined) {
        return this.tagResult(result);
      }
    }
    throw new Error(
      `Could not inject value of type ${type.name} since no compatible injection handler returned a value.`
    );
  };

  /**
   * `create(type: Class, ...parameters: any[])`
   *
   * Creates an instance of the given class and fills in all the constructor parameters decorated with `@inject`.
   * Parameters given after the type will be passed to the constructor, potentially overriding
   * the injection value.
   */
  create = <T, U, V, W>(
    type: new(arg1?: U, arg2?: V, arg3?: W, ...remaining: any[]) => T,
    arg1?: U,
    arg2?: V,
    arg3?: W,
    ...remaining: any[]
  ): T => {
    if (!type) {
      throw new Error('No type to create was given');
    }
    const args = [arg1, arg2, arg3].concat(remaining);
    const finalArgs: any[] = [];
    const paramInfo = getParamInfo(type) || [];
    const paramCount = Math.max(type.length, args.length, paramInfo.length);
    for (let i = 0; i < paramCount; i++) {
      if (args[i] === undefined && paramInfo[i]) {
        finalArgs[i] = this.resolve(paramInfo[i].type, paramInfo[i].injectParam || null);
      } else {
        finalArgs[i] = args[i];
      }
    }
    const result = new type(...finalArgs);
    this.scheduleResolveProperties(result);
    this.resolvePropertyInjections();
    return this.tagResult(result);
  };

  private scheduleResolveProperties(result: unknown) {
    if (result instanceof Object && this.resolveQueue.indexOf(result) === -1) {
      this.resolveQueue.push(result);
    }
  }

  private resolvePropertyInjections() {
    if (this.injectionStack.length === 0 && this.resolveQueue.length) {
      const queue = this.resolveQueue;
      this.resolveQueue = [];
      while (queue.length) {
        const resolved = queue.shift();
        if (resolved instanceof Object) {
          const props = getCustomProperties<any>(resolved);
          for (const prop of Object.keys(props)) {
            if (props[prop].inject && !resolved[prop]) {
              throw new Error(
                `Property "${prop}" of ${resolved.constructor.name} was not resolved, value is ${resolved[prop]}`
              );
            }
          }
        }
      }
    }
  }

  private findHandlerRegistrations<T>(type: BaseConstructor<T>): Array<HandlerRegistration<T, T>> {
    if (!type) {
      throw new Error(
        `Could not inject value since type is ${type}. You may have a broken import, circular module dependencies or an incorrect tsconfig.json configuration.`
      );
    }
    return this.handlers.get(type.prototype) || [];
  }

  private getUnboxer(type: any) {
    if (type === Number || type === String || type === Boolean) {
      return this.unboxValue;
    }
    return this.passValue;
  }

  private passValue(value: any) {
    return value;
  }

  private unboxValue(box: any) {
    return box !== null && box !== undefined ? box.valueOf() : box;
  }

  private forEachPrototype(type: BaseConstructor<any>, cb: (prototype: object) => void) {
    let currentProto = type.prototype;
    while (currentProto !== Object.prototype) {
      cb(currentProto);
      currentProto = Object.getPrototypeOf(currentProto);
    }
  }

  private tagResult(value: any) {
    if (value instanceof Object) {
      value[injectorKey] = this;
    }
    return value;
  }

}

export const injector = new Injector();

type HandlersMap = Map<object, Array<HandlerRegistration<any, any>>>;
