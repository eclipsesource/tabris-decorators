import 'reflect-metadata';
import {Widget, WidgetCollection} from 'tabris';
import {Composite} from 'tabris';
import {applyClassDecorator, BaseConstructor, ClassDecoratorFactory} from '../internals//utils';
import {isAppended, markAsAppended, markAsComponent, originalAppendKey, postAppendHandlers, WidgetInterface} from '../internals//utils-databinding';
import {processOneWayBindings} from '../internals/processOneWayBindings';

/**
 * A decorator for classes extending `Composite` (directly or indirectly),
 * otherwise known as a "custom component".
 *
 * Encapsules instances of the decorated class and enables data binding features.
 *
 * Example for a one-way binding between property `myText` of the decorated
 * class and property `text` of a child element:
 *
 * ```jsx
 * this.append(
 *  <TextView bind-text='myText'/>
 * );
 * ```
 *
 * *Notes:*
 * * *This works on all children (direct or indirect) of the component.
 * * *Consult the developer guide article on `@component` for further details of one-way bindings.*
 * * *Due to the encapsulation feature children of the component are only accessible
 *    using either `@getById` or the protected `_children`, `_find` and `_apply` methods.*
 * * *For creating two-way bindings use `@bind` and `@bindAll`.*
 */
export function component(type: BaseConstructor<Composite>) {
  markAsComponent(type);
  isolate(type);
  addOneWayBindingsProcessor(type);
  patchAppend(type);
}

function isolate(type: BaseConstructor<Widget>) {
  if (type.prototype.children !== returnEmptyCollection) {
    type.prototype.children = returnEmptyCollection;
  }
}

function addOneWayBindingsProcessor(type: BaseConstructor<Widget>): void;
function addOneWayBindingsProcessor(...args: any[]): void | ClassDecoratorFactory<Widget> {
  return applyClassDecorator('bindingBase', args, (type: BaseConstructor<Widget>) => {
    postAppendHandlers(type.prototype).push(base => {
      base._find().forEach(child => processOneWayBindings(base, child));
    });
  });
}

function returnEmptyCollection() {
  return new WidgetCollection([]);
}

function patchAppend(type: BaseConstructor<Widget>) {
  const widgetProto = type.prototype as WidgetInterface;
  if (widgetProto.append !== customAppend) {
    widgetProto[originalAppendKey] = widgetProto.append;
    widgetProto.append = customAppend;
  }
}

function customAppend(this: WidgetInterface): any {
  const result = this[originalAppendKey].apply(this, arguments);
  if (!isAppended(this)) {
    markAsAppended(this);
    runPostAppendHandler(this);
  }
  return result;
}

function runPostAppendHandler(widgetInstance: WidgetInterface) {
  for (const fn of postAppendHandlers(widgetInstance)) {
    fn(widgetInstance);
  }
}
