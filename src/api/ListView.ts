import { ChangeListeners, CollectionView, JSXAttributes, Properties } from 'tabris';
import { Cell, TextCell } from './Cell';
import { getValueString } from './checkType';
import { List, ListLike, listObservers, Mutation } from './List';
import { component } from '../decorators/component';
import { event } from '../decorators/event';

@component
export class ListView<ItemType> extends CollectionView<Cell<ItemType>> {

  public jsxAttributes: JSXAttributes<this> & {children: Cell[]};

  public set items(value: ListLike<ItemType>) {
    if (value === this._items) {
      return;
    }
    if (!(value instanceof List) && !(value instanceof Array) && value !== null) {
      throw new Error('Failed to set property "items": ' + getValueString(value) + ' is not a List or Array');
    }
    if (this._items instanceof List) {
      listObservers(this._items).removeListener(this._handleMutation);
    }
    const oldValue = this._items;
    this._items = value;
    this._autoUpdate(oldValue);
    if (value instanceof List) {
      listObservers(value).addListener(this._handleMutation);
    }
    this.onItemsChanged.trigger({value});
  }

  public get items() {
    return this._items;
  }

  @event public onItemsChanged: ChangeListeners<this, 'items'>;
  protected _items: ListLike<ItemType> = null;

  constructor(properties: Properties<ListView<ItemType>> = {}) {
    super();
    this
      .set({createCell, updateCell} as any /* tabris declarations bug */)
      .set(properties);
  }

  protected _handleMutation = ({start, deleteCount, items}: Mutation<ItemType>) => {
    if (start === 0 && this.items.length === items.length) {
      return this.load(items.length);
    }
    const refreshCount = Math.min(items.length, deleteCount);
    for (let i = start; i < start + refreshCount; i++) {
      this.refresh(i);
    }
    if (deleteCount > items.length) {
      this.remove(start + refreshCount, deleteCount - refreshCount);
    } else if (items.length > deleteCount) {
      this.insert(start + refreshCount, items.length - refreshCount);
    }
  }

  protected _autoUpdate(oldList: ListLike<ItemType>): void {
    if (!(this._items instanceof Array && oldList instanceof Array)) {
      return this.load((this._items || []).length);
    }
    if (this._items.length === oldList.length) {
      return this._items.forEach((value, index) => {
        if (value !== oldList[index]) { this.refresh(index); }
      });
    }
    if (this._items.length > oldList.length) {
      const range = getDiff(this._items, oldList);
      if (range) {
        return this.insert(range[0], range[1]);
      }
    }
    if (this._items.length < oldList.length) {
      const range = getDiff(oldList, this._items);
      if (range) {
        return this.remove(range[0], range[1]);
      }
    }
    this.load(this._items.length);
  }

  // tslint:disable-next-line
  public [JSX.jsxFactory](Type, attributes) {
    const {children, ...pureAttributes} = attributes;
    const result = CollectionView.prototype[JSX.jsxFactory].call(this, Type, pureAttributes);
    if (children) {
      result.createCell = Cell.factory(children[0]);
    }
    return result;
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

function createCell(): Cell<any> {
  return new TextCell();
}

function updateCell<T>(this: ListView<T>, cell: Cell<T>, index: number) {
  cell.item = this.items[index];
}
