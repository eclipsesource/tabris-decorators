import {
  DecoratorFactory,
  applyPropertyDecorator,
  defineProperty,
  getInitConfig,
  getPropertyStore,
  getPropertyType,
  checkType,
  markInitialized,
  isInitialized,
  getValueTypeName,
  markInitialionFailed,
  failedToInitialize,
  isPrimitiveType,
  areStaticDecoratorArgs
} from './utils';

export interface InitializationOptions {strict?: boolean; deep?: boolean; }

export default function initialize<T extends object>(target: T, source: any, options: InitializationOptions = {}): T {
  try {
    checkInitParams(target, source);
    initializeSecure(target, source, options);
    markInitialized(target);
  } catch (ex) {
    markInitialionFailed(target);
    throw new Error(`Could not initialize object of type "${getValueTypeName(target)}": ${ex.message}`);
  }
  return target;
}

export function required(processor: (value: any) => any): DecoratorFactory;
export function required(targetProto: object, property: string): void;
export function required(...args: any[]): any {
  return applyPropertyDecorator('required', args, (proto: object, property: string) => {
    getInitConfig(proto).set(property, {
      type: getPropertyType(proto, property),
      optional: false,
      converter: areStaticDecoratorArgs(args) ? noConvert : args[0]
    });
    defineInitProperty(proto, property);
  });
}

export function optional(fallback: any): DecoratorFactory;
export function optional<T>(fallback: T, processor: (value: T) => any): DecoratorFactory;
export function optional(...args: any[]) {
  return applyPropertyDecorator('optional', args, (proto: object, property: string) => {
    getInitConfig(proto).set(property, {
      type: getPropertyType(proto, property),
      optional: true,
      fallback: args[0],
      converter: args[1] || noConvert
    });
    defineInitProperty(proto, property);
  });
}

/* Internals */

function initializeSecure(target: any, source: any, options: InitializationOptions) {
  let checkList = options.strict ? Object.assign({}, source) : {};
  let initConfig = getInitConfig(target);
  let propertyStore = getPropertyStore(target);
  for (let entry of initConfig) {
    let[property, config] = entry;
    try {
      let sourceHasProperty = property in source;
      if (!sourceHasProperty && !config.optional) {
        throw new Error('Entry is missing in source object.');
      }
      let value = config.converter(sourceHasProperty ? source[property] : config.fallback);
      if (options.deep && !isPrimitiveType(config.type ) && !(value instanceof config.type )) {
        propertyStore.set (property, new config.type (value));
      } else {
       propertyStore.set (property, checkType(value, config.type ));
      }
    } catch (ex) {
      throw new Error(
        `Could not initialize ${config.optional ? 'optional' : 'required'} property "${property}": ${ex.message}`
      );
    }
    delete checkList[property];
  }
  checkChecklist(checkList);
}

function defineInitProperty(proto: object, property: string) {
  defineProperty({proto, property,
    processSet(target: any) {
      throw new Error(`Property "${property}" can only be set using the initialize function.`);
    },
    processGet(target: any, value: any) {
      if (!isInitialized(target)) {
        throw new Error(`Property "${property}" has not been initialized.`);
      }
      return value;
    }
  });
}

function checkInitParams(target: any, source: any) {
  if (isInitialized(target) || failedToInitialize(target)) {
    throw new Error('Object can only be initialized once.');
  }
  if (!(source instanceof Object) || Object.getPrototypeOf(source) !== Object.prototype) {
    throw new Error('Source is not a plain object.');
  }
}

function checkChecklist(checkList: any) {
  if (Object.keys(checkList).length > 0) {
    throw new Error(`Source property "${Object.keys(checkList)[0]}" does not exist on target or is not decorated.`);
  }
}

function noConvert(value: any) {
  return value;
}
