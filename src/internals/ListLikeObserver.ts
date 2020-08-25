import {getValueString, List, ListLike, listObservers, Mutation} from '..';

export class ListLikeObserver<T> {

  private _source: ListLike<T> = null;

  constructor(
    private _callback: (ev: Mutation<T>) => void
  ) { }

  set source(value: ListLike<T>) {
    if (value === this._source) {
      return;
    }
    if (!(value instanceof List) && !(value instanceof Array) && value !== null) {
      throw new Error(getValueString(value) + ' is not a List or Array');
    }
    if (this._source instanceof List) {
      listObservers(this._source).removeListener(this._callback);
    }
    const oldValue = this._source;
    this._source = value;
    this._autoUpdate(oldValue);
    if (value instanceof List) {
      listObservers(value).addListener(this._callback);
    }
  }

  get source() {
    return this._source;
  }

  protected _autoUpdate(prevSource: ListLike<T>): void {
    if (!(this._source instanceof Array && prevSource instanceof Array)) {
      return this._callback({
        start: 0,
        deleteCount: (prevSource || []).length,
        target: this._source || [],
        items: Array.from(this._source || [])
      });
    }
    const source = this._source as T[];
    if (source.length === prevSource.length) {
      return source.forEach((value, index) => {
        if (value !== prevSource[index]) {
          return this._callback({
            start: index,
            deleteCount: 1,
            items: [source[index]],
            target: source
          });
        }
      });
    }
    if (source.length > prevSource.length) {
      const range = getDiff(source, prevSource);
      if (range) {
        return this._callback({
          start: range[0],
          deleteCount: 0,
          items: source.slice(range[0], range[0] + range[1]),
          target: source
        });
      }
    }
    if (source.length < prevSource.length) {
      const range = getDiff(prevSource, source);
      if (range) {
        return this._callback({
          start: range[0],
          deleteCount: range[1],
          items: [],
          target: source
        });
      }
    }
    this._callback({
      start: 0,
      deleteCount: prevSource.length,
      items: source,
      target: source
    });
  }
}

/**
 * Returns a single range that changed (insert or delete) between two arrays.
 * If this is not possible returns null instead. Assumes the item count has changed.
 */
function getDiff(listA: ListLike<unknown>, listB: ListLike<unknown>): [number, number] {
  const start = getMatchLength([listB, 0], [listA, 0]);
  if (start === listB.length) {
    return [start, listA.length - start];
  }
  const nextMatch = listA.indexOf(listB[start], start);
  if (nextMatch < 0) {
    return null;
  }
  const length = nextMatch - start;
  const tail = getMatchLength([listB, start], [listA, start + length]);
  if (((start + length + tail) === listA.length) && ((start + tail) === listB.length)) {
    return [start, length];
  }
  return null;
}

/**
 * Returns the amount of items that are equal between the two
 * arrays starting from the given offsets.
 */
function getMatchLength(
  [itemsA, offsetA]: [ListLike<unknown>, number],
  [itemsB, offsetB]: [ListLike<unknown>, number]
): number {
  let indexA = offsetA;
  let indexB = offsetB;
  while (indexA < itemsA.length && indexB < itemsB.length) {
    if (itemsA[indexA] === itemsB[indexB]) {
      indexA++;
      indexB++;
    } else {
      break;
    }
  }
  return indexA - offsetA;
}
