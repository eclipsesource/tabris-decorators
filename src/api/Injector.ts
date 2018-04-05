import { inject as unboundInject } from '../decorators/inject';
import { injectable as unboundInjectable } from '../decorators/injectable';
import { injectionHandler as unboundInjectionHandler } from '../decorators/injectionHandler';
import { shared as unboundShared } from '../decorators/shared';
import { ExtendedJSX } from '../internals/ExtendedJSX';
import { BaseConstructor, getParamInfo } from '../internals/utils';

export type InjectionParameter = object | string | number | boolean | null;

export interface Injection {
  type: BaseConstructor<any>;
  param: InjectionParameter;
  injector: Injector;
}

export type InjectionHandlerFunction<T> = (injection: Injection) => T | null | undefined;

export class Injector {

  // tslint:disable:typedef
  public readonly injectionHandler = unboundInjectionHandler;
  public readonly inject = unboundInject;
  public readonly injectable = unboundInjectable;
  public readonly shared = unboundShared;
  // tslint:enable:typedef
  public readonly JSX: ExtendedJSX = new ExtendedJSX(this);
  private handlers: HandlersMap = new Map();

  constructor() {
    this.injectionHandler = this.injectionHandler.bind(this);
    this.injectable = this.injectable.bind(this);
    this.shared = this.shared.bind(this);
    this.inject = this.inject.bind(this);
  }

  public addHandler = <T, U extends T>(targetType: BaseConstructor<T>, handler: InjectionHandlerFunction<U>) => {
    if (!targetType || !handler) {
      throw new Error('invalid argument');
    }
    this.forEachPrototype(targetType, (prototype: object) => {
      let targetTypeHandlers = this.handlers.get(prototype);
      if (!targetTypeHandlers) {
        this.handlers.set(prototype, targetTypeHandlers = []);
      }
      targetTypeHandlers.unshift(handler);
    });
  }

  public resolve = <T>(type: BaseConstructor<T>, param: InjectionParameter = null) => {
    let handlers = this.findCompatibleHandlers(type);
    if (!handlers.length) {
      throw new Error(
        `Could not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    let unbox = this.getUnboxer(type);
    for (let handler of handlers) {
      let result = unbox(handler({type, injector: this, param}));
      if (result !== null && result !== undefined) {
        return result;
      }
    }
    throw new Error(
      `Could not inject value of type ${type.name} since no compatible injection handler returned a value.`
    );
  }

  public create = <T, U, V, W>(
    type: {new(arg1?: U, arg2?: V, arg3?: W, ...remaining: any[]): T; },
    arg1?: U,
    arg2?: V,
    arg3?: W,
    ...remaining: any[]
  ): T => {
    if (!type) {
      throw new Error('No type to create was given');
    }
    try {
      let args = [arg1, arg2, arg3].concat(remaining);
      let finalArgs: any[] = [];
      let paramInfo = getParamInfo(type) || [];
      let paramCount = Math.max(type.length, args.length, paramInfo.length);
      for (let i = 0; i < paramCount; i++) {
        if (args[i] === undefined && paramInfo[i]) {
          finalArgs[i] = this.resolve(paramInfo[i].type, paramInfo[i].injectParam || null);
        } else {
          finalArgs[i] = args[i];
        }
      }
      return new type(...finalArgs);
    } catch (ex) {
      throw new Error(`Could not create instance of ${type.name}:\n${ex.message}`);
    }
  }

  private findCompatibleHandlers<T>(type: BaseConstructor<T>): Array<InjectionHandlerFunction<T>> {
    if (!type) {
      throw new Error(
        `Could not inject value since type is ${type}. Do you have circular module dependencies?`
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

}

export const injector = new Injector();

type HandlersMap = Map<object, Array<InjectionHandlerFunction<any>>>;
