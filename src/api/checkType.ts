import {BaseConstructor, isPrimitiveType} from '../internals/utils';

/**
 * Performs type checks on the given value. If the check fails the function throws an error message stating the reason.
 *
 * The following rules apply:
 * * Object constructor passes any value
 * * Object values may be an instance of the given class or any class extending it.
 * * Primitive types are represented by their boxed type, e.g. a number is `Number`.
 * * Null and undefined pass unless 'strict' is true
 * * Boxed values never pass.
 */
export function checkType(value: any, type: BaseConstructor<any>, strict?: boolean) {
  if (!type) {
    throw new Error('No type given');
  }
  if (isBoxedValue(value)) {
    throw new Error('Boxed values are forbidden');
  }
  if (!isType(value, type, strict)) {
    throw new Error(
      `Expected ${getValueString(value)} to be of type ${getTypeName(type)}, but found ${getValueTypeName(value)}.`
    );
  }
}

export function isType(value: any, type: BaseConstructor<any>, strict?: boolean): boolean {
  if (!type || type === Object) {
    return true;
  }
  if (!strict && (value === null || value === undefined)) {
    return true;
  }
  if (value instanceof type || isPrimitiveOfType(value, type)) {
    return true;
  }
  return false;
}

export function getValueString(value: any): string {
  let result = 'value';
  if (value === '') {
    result += ' [empty string]';
  } else if (isPrimitiveValue(value)) {
    return result += ` "${value}"`;
  }
  return result;
}

export function getTypeName(type: BaseConstructor<any>) {
  const name = type.name;
  if (isPrimitiveType(type)) {
    return name.toLowerCase();
  }
  return name;
}

function getValueTypeName(value: any) {
  if (value && value.constructor) {
    return getTypeName(value.constructor);
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function isPrimitiveOfType(value: any, type: BaseConstructor<any>): boolean {
  if (!isPrimitiveType(type)) {
    return false;
  }
  return typeof value === getTypeName(type);
}

function isBoxedValue(value: any) {
  return value instanceof Boolean || value instanceof Number || value instanceof String;
}

function isPrimitiveValue(value: any) {
  return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
}
