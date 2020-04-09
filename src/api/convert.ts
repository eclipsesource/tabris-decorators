import {NativeObject} from 'tabris';
import {checkType, getTypeName, getValueString} from './checkType';

type Factory = (value: unknown) => any;

const floatRegEx = /^[+-]?([0-9]+|[0-9]*\.[0-9]+)$/;

const staticNumbers = Object.freeze({
  '': 0,
  'nan': NaN,
  'infinity': Infinity,
  '-infinity': -Infinity
});

const staticBoolean = Object.freeze({
  '': false,
  '1': true,
  '0': false,
  'true': true,
  'false': false
});

const typedArrayTypes = Object.freeze([
  Int8Array, Int8Array, Int16Array, Int32Array,
  Uint8Array, Uint8Array, Uint16Array, Uint32Array,
  Uint8ClampedArray, Float32Array, Float64Array, ArrayBuffer
]);

export function convert(value: unknown, type: Function): any {
  if (!(type instanceof Function) || type === Object || !type.prototype) {
    throw new Error('Invalid type');
  }
  if (type === NativeObject || type.prototype instanceof NativeObject) {
    throw new Error('Invalid type');
  }
  try {
    if (type === Number) {
      return toNumber(value);
    } else if (type === Boolean) {
      return toBoolean(value);
    } else if (type === String) {
      return toString(value);
    } else if (type === Array) {
      return toArray(value);
    } else if (typedArrayTypes.indexOf(type as any) !== -1) {
      return toTypedArray(value, type);
    }
    return toObject(value, type);
  } catch (ex) {
    fail(value, type, ex);
  }
}

function toNumber(value: unknown): number {
  if (value == null) {
    return 0;
  } else if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'boolean') {
    return value ? 1 : 0;
  } else if (typeof value === 'string') {
    return stringToNumber(value);
  } else if (value instanceof Object) {
    return objectToNumber(value);
  }
  fail(value, Number);
}

function toBoolean(value: unknown): boolean {
  if (value == null) {
    return false;
  } else if (typeof value === 'number') {
    return !isNaN(value) && value > 0;
  } else if (typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'string') {
    return stringToBoolean(value);
  } else if (value instanceof Object) {
    return objectToBoolean(value);
  }
  fail(value, Boolean);
}

function toString(value: unknown): string {
  if (value == null) {
    return '';
  } else if (typeof value === 'number') {
    return isNaN(value) ? '' : String(value).toLocaleLowerCase();
  } else if (value instanceof Object) {
    return objectToString(value);
  }
  return String(value);
}

function toArray(value: unknown): unknown[] {
  if (value instanceof Array) {
    return value;
  } else if (value instanceof Object) {
    if (value instanceof Function) {
      return [unwrapObject(value)];
    } else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return Array.from(new Uint8ClampedArray(value instanceof ArrayBuffer ? value : value.buffer));
    } else if (isArrayLike(value)) {
      return Array.from(value);
    } else if (hasConverter(value, 'toArray')) {
      return (value as any).toArray();
    }
    return Object.keys(value).map(key => value[key]);
  } else if (typeof value === 'string') {
    return value.split(',').map(part => part.trim());
  }
  return [value];
}

function toTypedArray(value: unknown, type: Function) {
  if (value instanceof type) {
    return value;
  } else if (ArrayBuffer.isView(value) && type === ArrayBuffer) {
    return value.buffer;
  } else if (ArrayBuffer.isView(value)) {
    return new (type as any)(value.buffer);
  } else if (value instanceof ArrayBuffer) {
    return new (type as any)(value);
  } else if (typeof value === 'string') {
    throw new Error('Not supported');
  }
  const targetType: any = type === ArrayBuffer ? Uint8ClampedArray : type;
  const typedArray = new targetType(toArray(value).map(toNumber));
  if (type === ArrayBuffer) {
    return typedArray.buffer;
  }
  return typedArray;
}

function toObject(value: unknown, type: Function): object {
  if (value instanceof type) {
    return value;
  } else if (typeof value === 'string' && hasFactory(type, 'parse')) {
    return verify(type.parse(value), type, 'Static method "parse"');
  } else if (hasFactory(type, 'from')) {
    return verify(type.from(value), type, 'Static method "from"');
  } else if (type.length > 0) {
    return new (type as any)(value);
  }
  fail(value, type);
}

function stringToNumber(value: string): number {
  const normal = value.trim().toLowerCase();
  if (normal in staticNumbers) {
    return staticNumbers[normal];
  } else if (normal.startsWith('0x')) {
    return notNaN(parseInt(normal, 16));
  } else if (floatRegEx.test(normal)) {
    return notNaN(parseFloat(value));
  }
  fail(value, Number);
}

function objectToNumber(value: object): number {
  const unwrapped = unwrapObject(value);
  if (typeof unwrapped === 'number') {
    return notNaN(unwrapped);
  } else if (hasConverter(value, 'toString')) {
    return stringToNumber(String(value));
  }
  fail(value, Number);
}

function stringToBoolean(value: string): boolean {
  const normal = value.trim().toLowerCase();
  if (normal in staticBoolean) {
    return staticBoolean[normal];
  }
  fail(value, Number);
}

function objectToBoolean(value: object): boolean {
  const unwrapped = unwrapObject(value);
  if (typeof unwrapped === 'boolean') {
    return unwrapped;
  } else if (hasConverter(value, 'toString')) {
    return stringToBoolean(String(value));
  }
  fail(value, Boolean);
}

function objectToString(value: object): string {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    throw new Error('Not supported');
  }
  try {
    if (value instanceof Error) {
      return value.message;
    } else if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    const unwrapped = unwrapObject(value);
    if (isPrimitive(unwrapped)) {
      return toString(unwrapped);
    } else if (value instanceof Function) {
      return value.name ? value.name : 'function';
    } else if (value instanceof Array) {
      return value.map(toString).join(', ');
    } else if (hasConverter(value, 'toLocaleString')) {
      return value.toLocaleString();
    } else if (hasConverter(value, 'toString')) {
      return value.toString();
    } else if (value.constructor.name) {
      return firstToLower(value.constructor.name);
    }
    return String(value);
  } catch (ex) {
    return ex.message;
  }
}

function unwrapObject(value: object): string | number | boolean {
  if (value instanceof Array && value.length === 1 && isPrimitive(value[0])) {
    return value[0];
  }
  if (value instanceof Function) {
    const returnValue = value.prototype ? new (value as any)() : value();
    if (isPrimitive(returnValue)) {
      return returnValue;
    }
  }
  if (hasConverter(value, 'valueOf')) {
    const valueOf = value.valueOf();
    if (isPrimitive(valueOf)) {
      return valueOf;
    }
  }
  if (('value' in value) && isPrimitive((value as any).value)) {
    return (value as any).value;
  }
}

function isPrimitive(value: unknown): value is (string | number | boolean) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function notNaN(value: unknown) {
  if (typeof value !== 'number' || isNaN(value)) {
    fail(value, Number);
  }
  return value;
}

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  const length = (value as any).length;
  return typeof length === 'number'
    && !isNaN(length)
    && isFinite(length)
    && length >= 0
    && length === Math.round(length);
}

function firstToLower(value: string): string {
  return value.slice(0, 1).toLocaleLowerCase() + value.slice(1);
}

function hasConverter<T extends string>(obj: any, property: T): boolean {
  return obj[property] instanceof Function
    && obj[property] !== Object.prototype[property as any]
    && obj[property].length === 0;
}

function hasFactory<T extends string>(obj: any, property: T): obj is {[key in T]: Factory} {
  return obj[property] instanceof Function
    && obj[property].length === 1;
}

function verify<T>(value: T, type: Function, source: string): T {
  try {
    checkType(value, type);
  } catch (ex) {
    throw new Error(source + 'returned invalid value: ' + ex.message);
  }
  return value;
}

function fail(value: unknown, type: Function, ex?: Error): never {
  throw new Error([
    'Can not convert ',
    getValueString(value),
    ' to ',
    getTypeName(type),
    ex ? ` (${ex.message})` : ''
  ].join(''));
}
