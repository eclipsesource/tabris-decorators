import { Injector } from '../api/Injector';
import { Constructor } from '../internals/utils';

export function bindDecoratorShared(injector: Injector): typeof unboundShared {
  return unboundShared.bind(injector);
}

export function unboundShared(type: Constructor<any>): void;
export function unboundShared(this: Injector, type: Constructor<any>): void {
  this.injectable({shared: true})(type);
}
