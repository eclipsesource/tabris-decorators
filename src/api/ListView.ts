import { ChangeListeners, CollectionView, EventObject, JSXAttributes, Listeners, Properties, Widget } from 'tabris';
import { Cell, ItemCheck, ItemTypeDef, TextCell } from './Cell';
import { ListLike, Mutation } from './List';
import { component } from '../decorators/component';
import { event } from '../decorators/event';
import { ListLikeObvserver } from '../internals/ListLikeObserver';

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

  public jsxAttributes: JSXAttributes<this> & {children?: Cell[]};
  @event public onItemsChanged: ChangeListeners<this, 'items'>;
  @event public onSelect: Listeners<ListViewSelectEvent<ItemType>>;

  private _observer: ListLikeObvserver<ItemType>;

  constructor(properties: Properties<ListView<ItemType>> = {}) {
    super();
    this._observer = new ListLikeObvserver(this._handleMutation);
    this
      .set({createCell: defaultCreateCell, updateCell} as any /* tabris declarations bug */)
      .set(properties);
  }

  public set items(value: ListLike<ItemType>) {
    if (value === this._observer.source) {
      return;
    }
    this._observer.source = value;
    this.onItemsChanged.trigger({value});
  }

  public get items() {
    return this._observer.source;
  }

  protected _handleMutation = ({start, deleteCount, items, target}: Mutation<ItemType>) => {
    if (start === 0 && target.length === items.length) {
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
    this._children().forEach(cell => {
      const newIndex = this.itemIndex(cell);
      if (newIndex >= 0) {
        cell.itemIndex = newIndex;
      }
    });
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

function defaultCreateCell(): Cell<any> {
  return new TextCell();
}

function updateCell<T>(this: ListView<T>, cell: Cell<T>, index: number) {
  cell.item = this.items[index];
  cell.itemIndex = index;
}
