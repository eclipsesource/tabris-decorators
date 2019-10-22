import { ChangeListeners, Composite, JSXAttributes, JSXChildren, Properties, TextView, Widget } from 'tabris';
import { component } from '../decorators/component';
import { event } from '../decorators/event';
import { property } from '../decorators/property';

@component
export class Cell<ItemType> extends Composite {

  public jsxAttributes: JSXAttributes<this> & {children?: JSXChildren<Widget>, item?: never};
  @property public item: ItemType = null;
  @event public onItemChanged: ChangeListeners<this, 'item'>;

  constructor(properties?: Properties<Composite>) {
    super();
    if (properties && ('item' in properties)) {
      throw new Error('item must not be initialized');
    }
    this.set(properties || {});
  }

}

export class TextCell extends Cell<any> {

  constructor() {
    super();
    const textView = new TextView().appendTo(this);
    textView.text = '' + this.item;
    this.onItemChanged(({value}) => {
      textView.text = '' + value;
    });
  }

}
