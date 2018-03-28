import { inject as unboundInject } from '../decorators/inject';
import { injectable as unboundInjectable } from '../decorators/injectable';
import { injectionHandler as unboundInjectionHandler } from '../decorators/injectionHandler';
import { shared as unboundShared } from '../decorators/shared';
import { ExtendedJSX } from '../internals/ExtendedJSX';
import { BaseConstructor, getParamInfo } from '../internals/utils';

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

  public addHandler = <T, U extends T>(targetType: BaseConstructor<T>, handler: InjectionHandler<U>) => {
    this.forEachPrototype(targetType, (prototype: object) => {
      let targetTypeHandlers = this.handlers.get(prototype);
      if (!targetTypeHandlers) {
        this.handlers.set(prototype, targetTypeHandlers = []);
      }
      let handlerObject: InjectionHandlerObject<T>
        = handler instanceof Function ? {handleInjection: handler} : handler;
      targetTypeHandlers.unshift(handlerObject);
    });
  }

  public resolve = <T>(type: BaseConstructor<T>, injection?: Injection) => {
    let injectionParam = injection || {type, injector: this, target: null, param: null};
    injectionParam.injector = this;
    let handlers = this.findCompatibleHandlers(type);
    if (!handlers.length) {
      throw new Error(
        `Could not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    let unbox = this.getUnboxer(type);
    for (let handler of handlers) {
      let result = unbox(handler.handleInjection(injectionParam, this));
      if (result !== null && result !== undefined) {
        return result;
      }
    }
    throw new Error(
      `Could not inject value of type ${type.name} since no compatible injection handler returned a value.`
    );
  }

  public create = <T, U, V, W>(
    type: {new(arg1?: U, arg2?: V, arg3?: W, ...args: any[]): T; },
    args: {0?: U, 1?: V, 2?: W, [index: number]: any, length: number} = []
  ): T => {
    if (!type) {
      throw new Error('No type to create was given');
    }
    try {
      let finalArgs: any[] = [];
      let paramInfo = getParamInfo(type) || [];
      let paramCount = Math.max(type.length, args.length, paramInfo.length);
      for (let i = 0; i < paramCount; i++) {
        finalArgs[i] = args[i];
        if (paramInfo[i]) {
          let injection = {
            type,
            param: paramInfo[i].injectParam || null,
            injector: this,
            target: null
          };
          finalArgs[i] = this.resolve(paramInfo[i].type, injection);
        }
      }
      return new type(...finalArgs);
    } catch (ex) {
      throw new Error(`Could not create instance of ${type.name}:\n${ex.message}`);
    }
  }

  private findCompatibleHandlers<T>(type: BaseConstructor<T>): Array<InjectionHandlerObject<T>> {
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

export interface Injection {
  type: BaseConstructor<any>;
  target: object | null;
  param: string | null;
  injector: Injector;
}

export type InjectionHandlerFunction<T> = (injection: Injection, injector: Injector) => T | null | undefined;

export interface InjectionHandlerObject<T> {
  handleInjection: InjectionHandlerFunction<T>;
}

export type InjectionHandler<T> = InjectionHandlerFunction<T> | InjectionHandlerObject<T>;

type HandlersMap = Map<object, Array<InjectionHandlerObject<any>>>;
