import {checkType, getValueString} from './checkType';

export type CompareFn = (valueA: unknown, valueB: unknown) => boolean;
export type CompareMode = 'strict' | 'shallow' | 'auto' | CompareFn;
export type ValuePair<T = unknown> = [T, T];
export type CustomEquals = {equals(value): boolean};

/**
 * Returns true if the two given values are equal.
 */
export function equals(values: ValuePair, mode: CompareMode): boolean {
  if (mode !== 'strict' && mode !== 'shallow' && mode !== 'auto' && !(mode instanceof Function)) {
    throw new Error('Invalid mode ' + getValueString(mode));
  }
  if (strictEqual(values)) {
    return true;
  }
  if (mode instanceof Function) {
    return booleanCheck('compare function', mode(values[0], values[1]));
  }
  if (mode === 'shallow') {
    return shallowEquals(values);
  }
  if (mode === 'auto') {
    return autoEquals(values);
  }
  return false;
}

function strictEqual(values: ValuePair) {
  if (typeof values[0] === 'number' && typeof values[1] === 'number') {
    return values[0] === values[1] || isNaN(values[0]) && isNaN(values[1]);
  }
  return values[0] === values[1];
}

function shallowEquals(values: ValuePair): boolean {
  if (!isObjectPair(values)) {
    return false;
  }
  if (isArrayPair(values)) {
    return compareArrays(values);
  }
  return compareObjects(values);
}

function autoEquals(values: ValuePair): boolean {
  if (!isObjectPair(values)) {
    return false;
  }
  if (isCustomEqualsPair(values)) {
    return booleanCheck('"equals" method', values[0].equals(values[1]));
  }
  if (isCustomValueOfPair(values)) {
    return compareValueOf(values);
  }
  if (isArrayPair(values) && values[0].constructor === Array) {
    return compareArrays(values);
  }
  if (values[0].constructor === Object) {
    return compareObjects(values);
  }
  return false;
}

function compareArrays(values: ValuePair<unknown[]>): boolean {
  return (values[0].length === values[1].length)
    && values[0].every((item, index) => item === values[1][index]);
}

function compareObjects(values: ValuePair<object>): boolean {
  const keysA = Reflect.ownKeys(values[0]).sort();
  const keysB = Reflect.ownKeys(values[1]).sort();
  return (keysA.length === keysB.length) && keysA.every((keyA, index) => {
    const keyB = keysB[index];
    return (keyA === keyB) && values[0][keyA] === values[1][keyB];
  });
}

function compareValueOf(values: ValuePair<object>): boolean {
  const valueOfA = values[0].valueOf();
  const valueOfB = values[1].valueOf();
  return valueOfA === valueOfB && typeof valueOfA !== 'object';
}

function isObjectPair(values: ValuePair): values is ValuePair<object> {
  if (typeof values[0] !== 'object' || typeof values[1] !== 'object') {
    return false;
  }
  if (values[0].constructor !== values[1].constructor) {
    return false;
  }
  return true;
}

function isArrayPair(values: ValuePair): values is ValuePair<unknown[]> {
  return values[0] instanceof Array && values[1] instanceof Array;
}

function isCustomEqualsPair(values: ValuePair<object>): values is ValuePair<CustomEquals> {
  const [objectA, objectB] = values as ValuePair<CustomEquals>;
  return objectA.equals instanceof Function
    && objectA.equals === objectB.equals
    && objectA.equals.length === 1;
}

function isCustomValueOfPair([objectA, objectB]: ValuePair<object>): boolean {
  return objectA.valueOf !== Object.prototype.valueOf
    && objectA.valueOf instanceof Function
    && objectA.valueOf === objectB.valueOf
    && objectA.valueOf.length === 0;
}

function booleanCheck(fnDesc: string, value: unknown): boolean {
  try {
    checkType(value, Boolean, true);
  } catch (ex) {
    throw new Error(`Invalid return value of ${fnDesc}: ${ex.message}`);
  }
  return value as boolean;
}
