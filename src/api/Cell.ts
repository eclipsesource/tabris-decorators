import {asFactory, Attributes, ChangeListeners, Composite, JSXCompositeAttributes, Properties, TextView, Widget} from 'tabris';
import {component} from '../decorators/component';
import {event} from '../decorators/event';
import {property} from '../decorators/property';
import {getJsxInfo, JsxInfo} from '../internals/ExtendedJSX';
import {Constructor} from '../internals/utils';
/* eslint-disable no-shadow */

const factory: unique symbol = Symbol('factory');

export type ItemTypeDef<T> = Constructor<T> | 'string' | 'number' | 'boolean';
export type ItemCheck<T> = (value: T) => boolean;
export type CellCreationArgs<ItemType> = {
  itemType?: ItemTypeDef<ItemType>,
  itemCheck?: ItemCheck<ItemType>,
  item?: never,
  selectable?: boolean
};

namespace internal {

  @component
  export class Cell<ItemType = unknown> extends Composite {

    static factory(original: Cell): () => Cell {
      if (!(original instanceof Cell)) {
        throw new Error('A cell factory can only be created from a Cell element');
      }
      if (!original[factory]) {
        let consumedOriginal = false;
        const jsxInfo = getJsxInfo(original);
        if (!('processor' in jsxInfo)) {
          throw new Error('Can not clone a non-JSX object');
        }
        original[factory] = () => {
          if (!consumedOriginal) {
            consumedOriginal = true;
            return original;
          }
          return createFromTemplate(jsxInfo);
        };
      }
      return original[factory];
    }

    jsxAttributes: JSXCompositeAttributes<this, Widget>
      & CellCreationArgs<ItemType>;

    @event onItemChanged: ChangeListeners<this, 'item'>;
    @event onItemIndexChanged: ChangeListeners<this, 'itemIndex'>;

    @property readonly selectable: boolean = false;
    @property readonly itemType: ItemTypeDef<ItemType>;
    @property readonly itemCheck: ItemCheck<ItemType>;
    @property({observe: true}) item: ItemType = null;
    @property(num => num >= -1) itemIndex: number = -1;

    private [factory]: () => this;

    constructor(properties?: Properties<Composite> & CellCreationArgs<ItemType>) {
      super();
      if (properties && ('item' in properties)) {
        throw new Error('item must not be initialized');
      }
      this.set<Composite & CellCreationArgs<ItemType>>(properties || {});
    }

    [JSX.jsxFactory](Type, attributes) {
      return Composite.prototype[JSX.jsxFactory].call(this, Type, attributes);
    }

  }

  // Allow public "apply" method to break encapsulation
  // to better enable functional components
  Cell.prototype.apply = (Cell.prototype as any)._apply;

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

}

export type CellConstructor = typeof internal.Cell;

export interface CellFactory extends CellConstructor {
  <ItemType>(
    attributes?: Attributes<internal.Cell<ItemType>>,
    selector?: (...args: any[]) => Cell
  ): Cell<ItemType>;
}

export type Cell<ItemType = unknown> = internal.Cell<ItemType>;
export const Cell = asFactory(internal.Cell) as CellFactory;

export const TextCell = asFactory(internal.TextCell);
export type TextCell = internal.TextCell;

function createFromTemplate(template: JsxInfo): any {
  if ('processor' in template) {
    const {processor: jsx, componentType, sfc, attributes, children} = template;
    const finalAttributes = Object.assign({}, attributes) as any;
    if (children) {
      finalAttributes.children = children.map(createFromTemplate);
    }
    if (sfc) {
      return jsx.createFunctionalComponent(sfc, finalAttributes);
    }
    return jsx.createCustomComponent(componentType, finalAttributes);
  }
  if (template.source instanceof Widget) {
    throw new Error('Can not create copy of non JSX-element Widget');
  }
  return template.source;
}
