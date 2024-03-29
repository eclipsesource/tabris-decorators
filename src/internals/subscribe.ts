import {EventObject, Listeners, NativeObject, ObservableData} from 'tabris';
import {CustomPropertyDescriptor} from './CustomPropertyDescriptor';

const force = Symbol();

export function subscribe(root: any, path: string[], cb: (value: unknown) => void) {
  checkParameter(root, path, cb);
  const [rootProperty, ...subProperties] = path;
  let currentValue;
  let cancel;
  const listener = (arg: any) => {
    if (shouldReact(arg, currentValue, root, rootProperty, subProperties)) {
      currentValue = root[rootProperty];
      if (subProperties.length) {
        if (cancel) {
          cancel();
        }
        if (currentValue && (currentValue instanceof Object)) {
          cancel = subscribe(currentValue, subProperties, cb);
        } else if (currentValue == null) {
          cb(undefined);
        } else {
          throw new TypeError(
            `Value of property "${rootProperty}" is of type ${typeof currentValue}, expected object`
          );
        }
      } else {
        cb(currentValue);
      }
    }
  };
  addChangeListener(root, rootProperty, listener);
  listener(force);
  return () => {
    removeChangeListener(root, rootProperty, listener);
    if (cancel) {
      cancel();
    }
  };
}

function shouldReact(
  arg: any,
  currentValue: any,
  root: any,
  rootProperty: string,
  subProperties: string[]
) {
  return (arg === force)
    || (currentValue !== root[rootProperty])
    || (!subProperties.length && arg.originalEvent instanceof EventObject);
}

function checkParameter(root: any, path: string[], cb: (value: unknown) => void) {
  if (!(root instanceof Object)) {
    throw new Error('root is not an Object');
  }
  if (!(path instanceof Array)) {
    throw new Error('path is not an Array');
  }
  if (path.length === 0) {
    throw new Error('path is not an Array');
  }
  if (path.some(entry => !entry)) {
    throw new Error('path contains invalid entries');
  }
  if (!(cb instanceof Function)) {
    throw new Error('callback is not a function');
  }
}

function addChangeListener(target: any, property: string, listener: (value: unknown) => void) {
  if (supportsChangeEvents(target, property)) {
    Listeners.getListenerStore(target).on(property + 'Changed', listener);
  }
}

function removeChangeListener(target: any, property: string, listener: (value: unknown) => void) {
  if (supportsChangeEvents(target, property)) {
    Listeners.getListenerStore(target).off(property + 'Changed', listener);
  }
}

export function supportsChangeEvents(target: Partial<EventTarget>, targetProperty: string): boolean {
  if (target instanceof NativeObject || target instanceof ObservableData) {
    return true; // anyone could fire change events
  }
  const changeEvent = targetProperty + 'Changed';
  const listenerProperty = 'on' + changeEvent.charAt(0).toUpperCase() + changeEvent.slice(1);
  const listeners: any = target[listenerProperty];
  if (listeners && listeners.original instanceof Listeners) {
    if (listeners.original.target !== target || listeners.original.type !== changeEvent) {
      throw new Error(listenerProperty + ' has wrong target or event type');
    }
    return true;
  }
  return CustomPropertyDescriptor.has(target, targetProperty);
}
