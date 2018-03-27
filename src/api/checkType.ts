import { BaseConstructor } from '../internals/utils';

export function checkType<T>(value: T, type: BaseConstructor<any> | null): T {
  if (type === Object || !type) {
    return value;
  }
  if (value === null || value === undefined || value instanceof type || isPrimitiveOfType(value, type)) {
    return value;
  }
  throw new Error(
    `Expected value to be of type "${getTypeName(type)}", but found "${getValueTypeName(value)}".`
  );
}

function getValueTypeName(value: any) {
  if (value && value.constructor) {
    return getTypeName(value.constructor);
  }
  return typeof value;
}

function isPrimitiveOfType(value: any, type: BaseConstructor<any>): boolean {
  if (!isPrimitiveType(type)) {
    return false;
  }
  return typeof value === getTypeName(type);
}

function getTypeName(type: BaseConstructor<any>) {
  let name = type.name;
  if (isPrimitiveType(type)) {
    return name.toLowerCase();
  }
  return name;
}

function isPrimitiveType(type: BaseConstructor<any>) {
  return type === Boolean || type === Number || type === String;
}
