import { ChangeListeners, Listeners } from 'tabris';
import { getPropertyStore } from '../internals/utils';

interface ListenersStore {[name: string]: Listeners<any>; }
interface TargetInstance {[key: string]: ListenersStore; }

/**
 * A decorator that can be attached to a property of the type `Listeners`.
 *
 * The name of the property must start with "on", e.g. "onMyEvent".
 * The property will become read-only and contain a `Listeners` instance
 * that is configured to dispatch events on the object it is attached to.
 *
 * When used on a widget the `Listeners` instance will be integrated in
 * the existing event system. Events triggered via one API will also be issued via the other.
 */
export function event(targetProto: object, propertyName: string): void {
  let propertyType = Reflect.getMetadata('design:type', targetProto, propertyName);
  if (propertyType !== Listeners && propertyType !== ChangeListeners) {
    throw new Error(`@event: Invalid type for property ${propertyName}` );
  }
  if (!/^on[A-Z]/.test(propertyName)) {
    throw new Error(`@event: Invalid name for property ${propertyName}` );
  }
  Object.defineProperty(targetProto, propertyName, {
    get() {
      let targetInstance = this as TargetInstance;
      let eventType = propertyName.charAt(2).toLowerCase() + propertyName.slice(3);
      let store = getPropertyStore(targetInstance);
      if (!store[propertyName]) {
        store[propertyName] = new Listeners<any>(targetInstance, eventType);
      }
      return store[propertyName];
    },
    enumerable: true,
    configurable: false
  });

}
