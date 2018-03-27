import { Listeners } from '../api/Listeners';
import { getPropertyStore } from '../internals/utils';

interface ListenersStore {[name: string]: Listeners<object>; }
interface TargetInstance {[key: string]: ListenersStore; }

export function event(targetProto: object, propertyName: string): void {
  let propertyType = Reflect.getMetadata('design:type', targetProto, propertyName);
  if (propertyType !== Listeners) {
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
        store[propertyName] = new Listeners<object>(targetInstance, eventType);
      }
      return store[propertyName];
    },
    enumerable: true,
    configurable: false
  });

}
