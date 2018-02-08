import { Constructor, getParamInfo, applyDecorator, BaseConstructor } from './utils';
import DefaultInjectionHandler, { InjectableConfig } from './DefaultInjectionHandler';

export interface Injection {
  type?: Constructor<any>;
  instance?: object;
  param?: string;
  name?: string;
  index?: number;
}

export interface InjectionHandler<T> {
  handleInjection(injection: Injection): T;
}

type HandlersMap = Map<BaseConstructor<any>, InjectionHandler<any>>;

export default class Injector {

  private handlers: HandlersMap = new Map<Constructor<any>, InjectionHandler<any>>();

  public getHandler<T>(targetType: BaseConstructor<T>): InjectionHandler<T> | null {
    return this.handlers.get(targetType) || null;
  }

  public addInjectable(type: Constructor<any>, config: InjectableConfig) {
    this.addHandler(type, new DefaultInjectionHandler(type, config));
  }

  // TODO check targetType
  public addHandler<T, U extends T>(targetType: BaseConstructor<T>, handler: InjectionHandler<U>): void {
    if (this.handlers.has(targetType)) {
      throw new Error(`Injector already has a handler for ${targetType.name}`);
    }
    this.handlers.set(targetType, handler);
  }

  public reset() {
    this.handlers.clear();
  }

  public resolve = <T>(type: Constructor<T>, injection?: Injection) => {
    let handler = this.findCompatibleHandler(type);
    if (!handler) {
      throw new Error(
        `Can not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    let unbox = getUnboxer(type);
    return unbox(handler.handleInjection(injection || {}));
  }

  public create = <T, U, V, W>(
    type: {new(arg1?: U, arg2?: V, arg3?: W, ...args: any[]): T; },
    args: {0?: U, 1?: V, 2?: W, [index: number]: any, length: number} = []
  ): T => {
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
  }

  private findCompatibleHandler<T>(type: Constructor<T>): InjectionHandler<T> | undefined {
    let result = this.handlers.get(type);
    if (!result) {
      for (let [registeredType, entry] of this.handlers) {
        if (registeredType.prototype instanceof type) {
          result = entry;
          break;
        }
      }
    }
    return result;
  }

}

export const instance = new Injector();

export type IHFunction<T> = (injection: Injection) => T;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type InjectionHandlerDeco<T> = (target: object, propertyName: string, descriptor: IHDescriptor<T>) => void;

export function injectionHandler<T>(targetType: Constructor<T>): InjectionHandlerDeco<T>;
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
  return box.valueOf();
}
