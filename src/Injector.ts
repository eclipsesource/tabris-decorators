import {Constructor, getParamInfo} from './utils';

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

interface HandlerEntry {handler: InjectionHandler<any>; used: boolean; }

type HandlersMap = Map<Constructor<any>, HandlerEntry>;

export default class Injector {

  private handlers: HandlersMap = new Map<Constructor<any>, HandlerEntry>();

  public getHandler<T>(targetType: Constructor<T>): InjectionHandler<T> | null {
    let handlerEntry = this.handlers.get(targetType);
    return handlerEntry ? handlerEntry.handler : null;
  }

  public addHandler<T, U extends T>(targetType: Constructor<T>, handler: InjectionHandler<U>): void {
    if (this.handlers.has(targetType)) {
      throw new Error(`Injector already has a handler for ${targetType.name}`);
    }
    this.handlers.set(targetType, {handler, used: false });
  }

  public removeHandler(targetType: Constructor<any>) {
    let handlerEntry = this.handlers.get(targetType);
    if (handlerEntry && handlerEntry.used) {
      throw new Error(`Can not remove InjectionHandler for type ${targetType.name} because it was already used.`);
    }
    this.handlers.delete(targetType);
  }

  public clearHandlers() {
    for (let [type, entry] of this.handlers) {
      if (entry.used) {
        throw new Error(
            'Can not clear Injector because InjectionHandler '
          + `for type ${type.name} was already used.`
        );
      }
    }
    this.handlers.clear();
  }

  public resolve = <T>(type: Constructor<T>, injection?: Injection) => {
    let handlerEntry = this.findCompatibleHandler(type);
    if (!handlerEntry) {
      throw new Error(
        `Can not inject value of type ${type.name} since no compatible injection handler exists for this type.`
      );
    }
    let unbox = getUnboxer(type);
    handlerEntry.used = true;
    return unbox(handlerEntry.handler.handleInjection(injection || {})) as T;
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

  private findCompatibleHandler(type: Constructor<any>): HandlerEntry | undefined {
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
