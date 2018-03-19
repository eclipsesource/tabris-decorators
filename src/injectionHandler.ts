import { Constructor, applyDecorator, BaseConstructor } from './utils';
import { Injector, Injection } from './Injector';

export type IHFunction<T> = (injection: Injection) => T | void;
export type IHDescriptor<T> = TypedPropertyDescriptor<IHFunction<T>>;
export type InjectionHandlerDeco<T> = (target: object, propertyName: string, descriptor: IHDescriptor<T>) => void;

export function injectionHandler<T>(targetType: BaseConstructor<T>): InjectionHandlerDeco<T>;
export function injectionHandler(this: Injector, ...args: any[]): any {
  return applyDecorator('injectionHandler', args, (target: object, targetProperty: string) => {
    let type = args[0] as Constructor<any>;
    if (target instanceof Function) {
      this.addHandler(type, {handleInjection: (injection) => target[targetProperty](injection)});
    } else if (isPrototype(target)) {
      let targetInstance = this.create(target.constructor);
      this.addHandler(type, {handleInjection: (injection) => targetInstance[targetProperty](injection)});
    } else {
      throw new Error('Decorator must be applied to a method');
    }
  });
}

function isPrototype(target: any): target is {constructor: Constructor<any>} {
  return target.constructor instanceof Function;
}
