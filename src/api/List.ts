import {Listeners} from 'tabris';

const data: unique symbol = Symbol('data');
const observers: unique symbol = Symbol('observers');
const init: unique symbol = Symbol('init');

export type ListLike<T> = {
  length: number,
  [index: number]: T,
  [Symbol.iterator](): IterableIterator<T>,
  entries(): IterableIterator<[number, T]>,
  // eslint-disable-next-line max-len
  find<S extends T>(predicate: (this: void, value: T, index: number, obj: ListLike<T>) => value is S, thisArg?: any): S | undefined,
  find(predicate: (value: T, index: number, obj: ListLike<T>) => unknown, thisArg?: any): T | undefined,
  findIndex(predicate: (value: T, index: number, obj: ListLike<T>) => unknown, thisArg?: any): number,
  forEach(callbackfn: (value: T, index: number, array: ListLike<T>) => void, thisArg?: any): void,
  indexOf(searchElement: T, fromIndex?: number): number,
  join(separator?: string): string,
  keys(): IterableIterator<number>,
  lastIndexOf(searchElement: T, fromIndex?: number): number,
  pop(): T | undefined,
  push(...items: T[]): number,
  shift(): T | undefined,
  splice(start: number, deleteCount?: number, ...items: T[]): T[],
  unshift(...items: T[]): number,
  values(): IterableIterator<T>
};

export type ListLikeConstructor = {
  new(arrayLength?: number): (any[] | ListLike<any>),
  new<T>(...items: T[]): (T[] | ListLike<T>),
  from<T>(arrayLike: ArrayLike<T> | Iterable<T>): ListLike<T>,
  from<T, U>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): ListLike<U>,
  of<T>(...items: T[]): ListLike<T>
};

export type Mutation<T> = {
  start: number,
  deleteCount: number,
  items: T[],
  target: ListLike<T>
};

export function listObservers<T>(list: List<T>): Listeners<Mutation<T>> {
  return list[observers];
}

export class List<T> implements ListLike<T> {

  static from<In,Out>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    arrayLike: ArrayLike<In> | Iterable<In>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapfn?: (v: In, k: number) => Out, thisArg?: any
  ): List<In> {
    const initData = Array.from.apply(Array, arguments);
    return new List<In>({[init]: initData});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static of<Item>(...items: Item[]): List<Item> {
    const initData = Array.of.apply(Array, arguments);
    return new List<Item>({[init]: initData});
  }

  private [data]: T[] = [];
  private [observers]: Listeners<Mutation<T>> = new Listeners(this, 'mutate');

  constructor(arrayLength?: number)
  constructor(...items: T[])
  constructor(initializer: {[init]: any[]})
  constructor() {
    const param: unknown = arguments.length === 1 ? arguments[0] : false;
    if (arguments.length === 0) {
      this[data] = new Array();
    } else if (typeof param === 'number') {
      this[data] = new Array(param);
    } else if (isInitializer(param)) {
      this[data] = param[init];
    } else {
      this[data] = new Array(...arguments);
    }
    return new Proxy(this, traps);
  }

  get length() {
    return this[data].length;
  }

  set length(value: number) {
    const oldLength = this[data].length;
    this[data].length = value;
    const newLength = this[data].length;
    this[observers].trigger({
      start: Math.min(oldLength, newLength),
      deleteCount: Math.max(oldLength - newLength, 0),
      items: new Array(Math.max(newLength - oldLength, 0))
    });
  }

  [Symbol.iterator]() {
    return this[data][Symbol.iterator]();
  }

  entries(): IterableIterator<[number, T]> {
    return this[data].entries();
  }

  // eslint-disable-next-line max-len
  find<S extends T>(predicate: (this: void, value: T, index: number, obj: List<T>) => value is S, thisArg?: any): S | undefined;
  find(predicate: (value: T, index: number, obj: List<T>) => unknown, thisArg?: any): T | undefined {
    return this[data].find((value, index) => predicate.call(thisArg, value, index, this));
  }

  findIndex(predicate: (value: T, index: number, obj: List<T>) => unknown, thisArg?: any): number {
    return this[data].findIndex((value, index) => predicate.call(thisArg, value, index, this));
  }

  forEach(callbackfn: (value: T, index: number, array: List<T>) => void, thisArg?: any): void {
    this[data].forEach((value, index) => callbackfn.call(thisArg, value, index, this));
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return this[data].indexOf(searchElement, fromIndex);
  }

  join(separator?: string): string {
    return this[data].join(separator);
  }

  keys(): IterableIterator<number> {
    return this[data].keys();
  }

  lastIndexOf(searchElement: T, fromIndex?: number): number {
    return this[data].lastIndexOf(searchElement, arguments.length > 1 ? fromIndex : this.length - 1);
  }

  pop(): T | undefined {
    const oldLength = this[data].length;
    const result = this[data].pop();
    this[observers].trigger({start: oldLength - 1, deleteCount: 1, items: []});
    return result;
  }

  push(...items: T[]): number {
    const oldLength = this[data].length;
    const result = this[data].push.apply(this[data], items);
    if (items.length) {
      this[observers].trigger({start: oldLength, deleteCount: 0, items});
    }
    return result;
  }

  shift(): T | undefined {
    const result = this[data].shift();
    this[observers].trigger({start: 0, deleteCount: 1, items: []});
    return result;
  }

  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    if (arguments.length === 0) {
      return [];
    }
    const oldLength = this[data].length;
    const startIndex = toInt(start);
    if (startIndex >= oldLength || ((arguments.length > 1) && (deleteCount == null) || (toInt(deleteCount) < 0))) {
      return [];
    }
    const finalStart = startIndex < 0 ? oldLength + startIndex : startIndex;
    const finalDeleteCount = Math.min(
      arguments.length < 2 ? (oldLength - finalStart) : toInt(deleteCount) as number,
      oldLength - finalStart
    );
    const result = this[data].splice(finalStart, finalDeleteCount, ...items);
    this[observers].trigger({
      start: finalStart,
      deleteCount: finalDeleteCount,
      items
    });
    return result;
  }

  unshift(...items: T[]): number {
    const result = this[data].unshift.apply(this[data], arguments);
    if (items.length) {
      this[observers].trigger({start: 0, deleteCount: 0, items});
    }
    return result;
  }

  values(): IterableIterator<T> {
    return this[data].values();
  }

  // TODO:
  // concat()
  // filter()
  // copyWithin()
  // every()
  // fill()
  // flat()
  // flatMap()
  // map()
  // reduce()
  // reduceRight()
  // reverse()
  // some()
  // sort()
  // slice()
  // toLocaleString()
  // toSource()
  // toString()
  // [@@iterator]()
  // [Symbol.isConcatSpreadable]
  // [Symbol.toStringTag]

}

export interface List<T> {
  [index: number]: T;
}

const traps = {
  ownKeys(target: List<any>) {
    return Reflect.ownKeys(target[data]);
  },
  has(target: List<any>, key: string | number | symbol) {
    if (isInt(key)) {
      return Reflect.has(target[data], key);
    }
    return Reflect.has(target, key);
  },
  get(target: List<any>, key: string | number | symbol) {
    if (isInt(key)) {
      return Reflect.get(target[data], key);
    }
    return Reflect.get(target, key);
  },
  set(target: List<any>, key: string | number | symbol, value: any) {
    if (isInt(key)) {
      const index = toInt(key);
      const length = target[data].length;
      target[data][index] = value;
      if (index >= length) {
        const items = new Array(index - length);
        items.push(value);
        target[observers].trigger({start: length, deleteCount: 0, items});
      } else {
        target[observers].trigger({start: index, deleteCount: 1, items: [value]});
      }
      return true;
    }
    return Reflect.set(target, key, value);
  },
  deleteProperty(target: List<any>, key: string | number | symbol) {
    if (isInt(key)) {
      const index = toInt(key);
      delete target[data][index];
      target[observers].trigger({start: index, deleteCount: 1, items: new Array(1)});
      return true;
    }
    return Reflect.deleteProperty(target, key);
  }
};

interface Initializer {
  [init]: any[];
}

function isInitializer(value: any): value is Initializer {
  return value instanceof Object && value[init] instanceof Array;
}

const intRegEx = /^[0-9]+$/;

function isInt(value: unknown): value is string | number {
  if (typeof value === 'string' && intRegEx.test(value)) {
    return true;
  } else if (typeof value === 'number') {
    return Math.round(value) === value;
  }
  return false;
}

function toInt(value: any): number {
  // eslint-disable-next-line no-new-wrappers
  const num = typeof value === 'number' ? value : new Number(value).valueOf();
  if (isNaN(value)) {
    return 0;
  }
  return Math.round(num);
}
