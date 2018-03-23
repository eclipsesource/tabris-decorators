import 'reflect-metadata';
import { Widget, WidgetCollection } from 'tabris';
import { processOneWayBindings } from '../internals//bind-one-way';
import { applyClassDecorator, BaseConstructor, ClassDecoratorFactory, isAppended, markAsAppended, markAsComponent, postAppendHandlers, WidgetInterface } from '../internals//utils';

export function component(type: BaseConstructor<Widget>) {
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
  let widgetProto = type.prototype;
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

const originalAppendKey = Symbol();
