import {ChangeListeners, Listeners} from 'tabris';
import {getPropertyStore} from '../internals/utils-databinding';

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
export function event(targetProto: object, evPropertyName: string): void {
  const evPropertyType = Reflect.getMetadata('design:type', targetProto, evPropertyName);
  checkPropertyType(evPropertyType, evPropertyName);
  checkPropertyName(evPropertyName, evPropertyType);
  if (evPropertyName.endsWith('Changed')) {
    defineGetter(targetProto, evPropertyName, function() {
      const targetInstance = this as TargetInstance;
      const propertyName = eventType(evPropertyName).slice(0, -7);
      const store = getPropertyStore(targetInstance);
      if (!store[evPropertyName]) {
        store[evPropertyName] = new ChangeListeners(targetInstance, propertyName);
      }
      return store[evPropertyName];
    });
  } else {
    defineGetter(targetProto, evPropertyName, function() {
      const targetInstance = this as TargetInstance;
      const store = getPropertyStore(targetInstance);
      if (!store[evPropertyName]) {
        store[evPropertyName] = new Listeners<any>(targetInstance, eventType(evPropertyName));
      }
      return store[evPropertyName];
    });
  }
}

function defineGetter(target: object, property: string, getter: () => any) {
  Object.defineProperty(target, property, {
    get: getter,
    enumerable: true,
    configurable: false
  });
}

function eventType(evPropertyName: string): string {
  return evPropertyName.charAt(2).toLowerCase() + evPropertyName.slice(3);
}

function checkPropertyType(propertyType: any, propertyName: string) {
  if (propertyType
    && (propertyType !== Object)
    && (propertyType !== Listeners)
    && (propertyType !== ChangeListeners)) {
    throw new Error(`@event: Invalid type for property ${propertyName}`);
  }
}

function checkPropertyName(propertyName: string, propertyType: any) {
  if (!/^on[A-Z]/.test(propertyName)) {
    throw new Error(`@event: Invalid name for property ${propertyName}`);
  }
  if (propertyType === ChangeListeners) {
    if (!/^on[A-Z].*Changed$/.test(propertyName)) {
      throw new Error(`@event: Invalid name for property ${propertyName}`);
    }
  }
}
