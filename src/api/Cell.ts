import {ChangeListeners, Composite, JSXAttributes, JSXChildren, Properties, TextView, Widget} from 'tabris';
import {component} from '../decorators/component';
import {event} from '../decorators/event';
import {property} from '../decorators/property';
import {getJsxTemplate, JsxTemplate} from '../internals/ExtendedJSX';
import {Constructor} from '../internals/utils';

const factory: unique symbol = Symbol('factory');

export type ItemTypeDef<T> = Constructor<T> | 'string' | 'number' | 'boolean';
export type ItemCheck<T> = (value: T) => boolean;
export type CellCreationArgs<ItemType> = {
  itemType?: ItemTypeDef<ItemType>,
  itemCheck?: ItemCheck<ItemType>,
  item?: never,
  selectable?: boolean
};

@component
export class Cell<ItemType = unknown> extends Composite {

  static factory(original: Cell): () => Cell {
    if (!(original instanceof Cell)) {
      throw new Error('A cell factory can only be created from a Cell element');
    }
    if (!original[factory]) {
      let consumedOriginal = false;
      const template = getJsxTemplate(original);
      if (!('jsx' in template)) {
        throw new Error('Can not clone a non-JSX object');
      }
      original[factory] = () => {
        if (!consumedOriginal) {
          consumedOriginal = true;
          return original;
        }
        return createFromTemplate(template);
      };
    }
    return original[factory];
  }

  jsxAttributes: JSXAttributes<this>
    & {children?: JSXChildren<Widget>}
    & CellCreationArgs<ItemType>;

  @event onItemChanged: ChangeListeners<this, 'item'>;
  @event onItemIndexChanged: ChangeListeners<this, 'itemIndex'>;

  @property readonly selectable: boolean = false;
  @property readonly itemType: ItemTypeDef<ItemType>;
  @property readonly itemCheck: ItemCheck<ItemType>;
  @property item: ItemType = null;
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

function createFromTemplate(template: JsxTemplate): any {
  if ('jsx' in template) {
    const {jsx, componentType, sfc, attributes, children} = template;
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
