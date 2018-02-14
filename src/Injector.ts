import { Constructor, getParamInfo, applyDecorator, BaseConstructor } from './utils';
import DefaultInjectionHandler, { InjectableConfig } from './DefaultInjectionHandler';

export interface Injection {
  type?: Constructor<any>;
  instance?: object;
  param?: string;
  name?: string;
  index?: number;
}

export type InjectionHandlerFunction<T> = (injection: Injection, injector: Injector) => T | null | undefined;

export interface InjectionHandlerObject<T> {
  handleInjection: InjectionHandlerFunction<T>;
}

export type InjectionHandler<T> = InjectionHandlerFunction<T> | InjectionHandlerObject<T>;

type HandlersMap = Map<object, Array<InjectionHandlerObject<any>>>;

export default class Injector {

  private handlers: HandlersMap = new Map();

  public addInjectable(type: Constructor<any>, config: InjectableConfig = {}) {
    this.addHandler(type, new DefaultInjectionHandler(type, config));
  }

  // TODO check targetType
  public addHandler<T, U extends T>(targetType: BaseConstructor<T>, handler: InjectionHandler<U>): void {
    forEachPrototype(targetType, (prototype: object) => {
      let targetTypeHandlers = this.handlers.get(prototype);
      if (!targetTypeHandlers) {
        this.handlers.set(prototype, targetTypeHandlers = []);
      }
      let handlerObject: InjectionHandlerObject<T>
        = handler instanceof Function ? {handleInjection: handler} : handler;
      targetTypeHandlers.unshift(handlerObject);
    });
  }

  public reset() {
    this.handlers.clear();
  }

  public resolve = <T>(type: BaseConstructor<T>, injection?: Injection) => {
    let handlers = this.findCompatibleHandlers(type);
    if (!handlers.length) {
      throw new Error(
        `Could not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    let unbox = getUnboxer(type);
    for (let handler of handlers) {
      let result = unbox(handler.handleInjection(injection || {}, this));
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
          let injection = {type, index: i, param: paramInfo[i].injectParam};
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

}

export const instance = new Injector();

export type IHFunction<T> = (injection: Injection) => T | void;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type InjectionHandlerDeco<T> = (target: object, propertyName: string, descriptor: IHDescriptor<T>) => void;

export function injectionHandler<T>(targetType: BaseConstructor<T>): InjectionHandlerDeco<T>;
export function injectionHandler(...args: any[]): any {
  return applyDecorator('injectionHandler', args, (target: object, targetProperty: string) => {
    let type = args[0] as Constructor<any>;
    if (target instanceof Function) {
      instance.addHandler(type, {handleInjection: (injection) => target[targetProperty](injection)});
    } else if (isPrototype(target)) {
      let targetInstance = instance.create(target.constructor);
      instance.addHandler(type, {handleInjection: (injection) => targetInstance[targetProperty](injection)});
    } else {
      throw new Error('Decorator must be applied to a method');
    }
  });
}

function isPrototype(target: any): target is {constructor: Constructor<any>} {
  return target.constructor instanceof Function;
}

function getUnboxer(type: any) {
  if (type === Number || type === String || type === Boolean) {
    return unboxValue;
  }
  return passValue;
}

function passValue(value: any) {
  return value;
}

function unboxValue(box: any) {
  return box !== null && box !== undefined ? box.valueOf() : box;
}

function forEachPrototype(type: BaseConstructor<any>, cb: (prototype: object) => void) {
  let currentProto = type.prototype;
  while (currentProto !== Object.prototype) {
    cb(currentProto);
    currentProto = Object.getPrototypeOf(currentProto);
  }
}
