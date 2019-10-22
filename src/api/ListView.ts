import { ChangeListeners, CollectionView, Properties } from 'tabris';
import { Cell, TextCell } from './Cell';
import { getValueString } from './checkType';
import { List, listObservers, Mutation } from './List';
import { component } from '../decorators/component';
import { event } from '../decorators/event';

@component
export class ListView<ItemType> extends CollectionView<Cell<ItemType>> {

  @event public onItemsChanged: ChangeListeners<this, 'items'>;
  protected _items: List<ItemType> = null;

  constructor(properties: Properties<ListView<ItemType>> = {}) {
    super();
    this
      .set({createCell, updateCell} as any /* tabris declarations bug */)
      .set(properties);
  }

  public set items(value: List<ItemType>) {
    if (value === this._items) {
      return;
    }
    if (!(value instanceof List) && value !== null) {
      throw new Error('Failed to set property "items": ' + getValueString(value) + ' is not a List');
    };
    if (this._items instanceof List) {
      listObservers(this._items).removeListener(this._handleMutation);
    }
    this._items = value;
    this.load(value ? value.length : 0);
    if (value instanceof List) {
      listObservers(value).addListener(this._handleMutation);
    }
    this.onItemsChanged.trigger({value});
  }

  public get items() {
    return this._items;
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

}

function createCell(): Cell<any> {
  return new TextCell();
}

function updateCell<T>(this: ListView<T>, cell: Cell<T>, index: number) {
  cell.item = this.items[index];
}
