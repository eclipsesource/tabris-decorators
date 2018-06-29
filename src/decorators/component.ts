import 'reflect-metadata';
import { Widget, WidgetCollection } from 'tabris';
import { Composite } from 'tabris';
import { processOneWayBindings } from '../internals//bind-one-way';
import { applyClassDecorator, BaseConstructor, ClassDecoratorFactory, isAppended, markAsAppended, markAsComponent, originalAppendKey, postAppendHandlers, WidgetInterface } from '../internals//utils';

/**
 * A decorator for classes extending `Widget`.
 *
 * Makes instances of the decorated class the base reference for databinding via the `@bind` decorator and
 * the JSX attribute prefix `bind-`.
 *
 * Example for the JSX binding syntax:
 *
 * ```jsx
 * this.append(
 *  <textView bind-text='myText'/>
 * );
 * ```
 * This binds the `TextView` property `text` to the property `myText` of the decorated class.
 * The base property (`myText`) must be bindable - see `@property`.
 * JSX bindings are resolved only with the first append call.
 *
 * The decorator also isolates the children of the class instance by making them accessible only internally via
 * `@getById` or the protected `_children`, `_find` and `_apply` methods.
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
  let widgetProto = type.prototype as WidgetInterface;
  if (widgetProto.append !== customAppend) {
    widgetProto[originalAppendKey] = widgetProto.append;
    widgetProto.append = customAppend;
  }
}

function customAppend(this: WidgetInterface): any {
  let result = this[originalAppendKey].apply(this, arguments);
  if (!isAppended(this)) {
    markAsAppended(this);
    runPostAppendHandler(this);
  }
  return result;
}

function runPostAppendHandler(widgetInstance: WidgetInterface) {
  for (let fn of postAppendHandlers(widgetInstance)) {
    fn(widgetInstance);
  }
}
