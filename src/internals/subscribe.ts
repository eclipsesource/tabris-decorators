import { Listeners } from 'tabris';
import { supportsChangeEvents } from './utils';

const force = Symbol();

export function subscribe(root: any, path: string[], cb: (value: unknown) => void) {
  checkParameter(root, path, cb);
  const [rootProperty, ...subProperties] = path;
  let currentValue;
  let cancel;
  const listener = (mode: any) => {
    if ((mode === force) || (currentValue !== root[rootProperty])) {
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
