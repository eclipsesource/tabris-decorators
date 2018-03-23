import { Injector } from '../api/Injector';
import { Constructor } from '../internals/utils';

export function shared(type: Constructor<any>): void;
export function shared(this: Injector, type: Constructor<any>): void {
  this.injectable({shared: true})(type);
}
