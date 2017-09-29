import {Constructor} from './utils';

export type InjectionHandler<T> = (parameter: string | undefined) => T;

export default class InjectionHandlerCollection {

  private handlers: HandlersMap = new Map<Constructor<any>, HandlerEntry>();

  public get<T>(targetType: Constructor<T>): InjectionHandler<T> | null {
    let handlerEntry = this.handlers.get(targetType);
    return handlerEntry ? handlerEntry.handler : null;
  }

  public add<T, U extends T>(targetType: Constructor<T>, handler: InjectionHandler<U>): void {
    if (this.handlers.has(targetType)) {
      throw new Error(`InjectionHandlerCollection already has a handler for ${targetType.name}`);
    }
    this.handlers.set(targetType, {handler, used: false});
  }

  public remove(targetType: Constructor<any>) {
    let handlerEntry = this.handlers.get(targetType);
    if (handlerEntry && handlerEntry.used) {
      throw new Error(`Can not remove InjectionHandler for type ${targetType.name} because it was already used.`);
    }
    this.handlers.delete(targetType);
  }

  public clear() {
    for (let entry of this.handlers) {
      if (entry[1].used) {
        throw new Error(
            'Can not clear InjectionHandlerCollection because InjectionHandler '
          + `for type ${entry[0].name} was already used.`
        );
      }
    }
    this.handlers.clear();
  }

  public resolve<T>(type: Constructor<T>, param?: string): T {
    let handlerEntry = this.handlers.get(type);
    if (!handlerEntry) {
      throw new Error(`Can not inject value of type ${type.name} since no injection handler exists for this type.`);
    }
    handlerEntry.used = true;
    return handlerEntry.handler(param);
  }

}

export const instance = new InjectionHandlerCollection();

interface HandlerEntry {handler: InjectionHandler<any>; used: boolean; }
type HandlersMap = Map<Constructor<any>, HandlerEntry>;
