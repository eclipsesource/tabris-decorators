import { ChangeListeners, CollectionView, EventObject, JSXAttributes, Listeners, Properties, Widget } from 'tabris';
import { Cell, ItemCheck, ItemTypeDef, TextCell } from './Cell';
import { getValueString } from './checkType';
import { List, ListLike, listObservers, Mutation } from './List';
import { component } from '../decorators/component';
import { event } from '../decorators/event';

type CellFactoryDef<T> = {
  itemType: ItemTypeDef<T>,
  itemCheck: ItemCheck<T>,
  itemHeight: 'auto' | number,
  create: () => Cell<T>
};

export enum ItemAction {
  Primary = 1,
  Secondary = 2,
  Toggle = 3,
  Dismiss = 4
}

export class ListViewSelectEvent<ItemType> extends EventObject<ListView<ItemType>> {

  constructor(
    public readonly item: ItemType,
    public readonly itemIndex: number,
    public readonly originalEvent: EventObject<Widget>,
    public readonly action: number
  ) {
    super();
  }

}

@component
export class ListView<ItemType> extends CollectionView<Cell<ItemType>> {

  public static selectPrimary(ev: EventObject<Widget>) {
    ListView.select(ev, ItemAction.Primary);
  }

  public static selectSecondary(ev: EventObject<Widget>) {
    ListView.select(ev, ItemAction.Secondary);
  }

  public static selectToggle(ev: EventObject<Widget>) {
    ListView.select(ev, ItemAction.Toggle);
  }

  public static selectDismiss(ev: EventObject<Widget>) {
    ListView.select(ev, ItemAction.Dismiss);
  }

  public static select(ev: EventObject<Widget>, action: number = 0) {
    const listView = ev.target.parent(ListView);
    const itemIndex = listView.itemIndex(ev.target);
    listView.onSelect.trigger(new ListViewSelectEvent(
      listView.items[itemIndex],
      itemIndex,
      ev,
      action
    ));
  }

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
  @event public onSelect: Listeners<ListViewSelectEvent<ItemType>>;
  protected _items: ListLike<ItemType> = null;

  constructor(properties: Properties<ListView<ItemType>> = {}) {
    super();
    this
      .set({createCell: defaultCreateCell, updateCell} as any /* tabris declarations bug */)
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
    const result: ListView<unknown>
      = CollectionView.prototype[JSX.jsxFactory].call(this, Type, pureAttributes);
    if (children instanceof Array) {
      const factories: Array<CellFactoryDef<unknown>> = children.map((child, index) => ({
        itemType: child.itemType,
        itemCheck: child.itemCheck,
        itemHeight: child.height,
        create: Cell.factory(child)
      }));
      result.cellType = getCellTypeCallback(result, factories);
      result.cellHeight = getCellHeightCallback(result, factories);
      result.createCell = getCreateCellCallback(factories);
    }
    return result;
  }

}

function getCellTypeCallback(
  listView: ListView<unknown>,
  factories: Array<CellFactoryDef<unknown>>
): ((index: number) => string ) {
  const cellFactoryIndex = (itemIndex: number) => {
    const item = listView.items[itemIndex];
    const factoryIndex = factories.findIndex(entry => factorySupportsItem(entry, item));
    if (factoryIndex < 0) {
      throw new Error('No cell factory found for item ' + itemIndex);
    }
    return factoryIndex;
  };
  return (itemIndex: number) => cellFactoryIndex(itemIndex) + '';
}

function getCellHeightCallback(
  listView: ListView<unknown>,
  factories: Array<CellFactoryDef<unknown>>
): ((index: number) => number | 'auto') {
  const fallback = typeof listView.cellHeight === 'number' ? listView.cellHeight : 'auto';
  return (itemIndex: number) => {
    const factory = factories.find(entry => factorySupportsItem(entry, listView.items[itemIndex]));
    if (!factory) {
      throw new Error('No cell factory found for item ' + itemIndex);
    }
    return factory.itemHeight === 'auto' ? fallback : factory.itemHeight;
  };
}

function factorySupportsItem(factory: CellFactoryDef<unknown>, item: unknown): boolean {
  if (factory.itemType instanceof Function && !(item instanceof factory.itemType)) {
    return false;
  }
  if (typeof factory.itemType === 'string' && typeof item !== factory.itemType) {
    return false;
  }
  if (factory.itemCheck instanceof Function && !factory.itemCheck(item)) {
    return false;
  }
  return true;
}

function getCreateCellCallback(
  factories: Array<CellFactoryDef<unknown>>
): (cellType: string) => Cell<unknown> {
  return (type: string) => {
    const factoryIndex = parseInt(type, 10);
    if (isNaN(factoryIndex)) {
      throw new Error('Invalid cell factory index ' + factoryIndex);
    }
    const result = factories[factoryIndex].create();
    if (result.selectable) {
      result.highlightOnTouch = true;
      result.onTap(ListView.select);
    }
    return result;
  };
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

function defaultCreateCell(): Cell<any> {
  return new TextCell();
}

function updateCell<T>(this: ListView<T>, cell: Cell<T>, index: number) {
  cell.item = this.items[index];
}
