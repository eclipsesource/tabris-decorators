import { NativeObject } from 'tabris';
import { Listeners } from '../api/Listeners';

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
      let collections = getCollections(targetInstance);
      if (!collections[propertyName]) {
        if (targetInstance instanceof NativeObject) {
          let eventType = propertyName.charAt(2).toLowerCase() + propertyName.slice(3);
          collections[propertyName] = new Listeners<object>(eventType, targetInstance);
        } else {
          collections[propertyName] = new Listeners<object>();
        }
      }
      return collections[propertyName];
    },
    enumerable: true,
    configurable: false
  });

}

function getCollections(instance: TargetInstance): ListenersStore {
  if (!instance[listenersSymbol]) {
    instance[listenersSymbol] = {};
  }
  return instance[listenersSymbol];
}

const listenersSymbol = Symbol('Listeners');
