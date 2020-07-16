import 'reflect-metadata';
import {asFactory, CallableConstructor, Composite, Widget, WidgetCollection} from 'tabris';
import {isAppended, markAsAppended, markAsComponent, originalAppendKey, postAppendHandlers, WidgetInterface} from '../internals//utils-databinding';
import {processOneWayBindings} from '../internals/processOneWayBindings';
import {applyDecorator, BaseConstructor, Constructor} from '../internals/utils';

type ComponentOptions = {};
type ComponentNonFactoryOptions = ComponentOptions & {factory?: false};
type ComponentFactoryOptions = ComponentOptions & {factory: true};
type ComponentOptionsUnion = ComponentOptions & {factory?: boolean};
type ComponentDecorator = <T extends Constructor<Composite>>(arg: T) => T;
type ComponentAsFactory = <T extends Constructor<Composite>>(arg: T) => CallableConstructor<T>;

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
export function component<T extends Constructor<Composite>>(arg: T): T;
export function component(options: ComponentNonFactoryOptions): ComponentDecorator;
export function component(options: ComponentFactoryOptions): ComponentAsFactory;
export function component<T>(arg: T): T | ComponentDecorator | ComponentAsFactory {
  return applyDecorator('component', [arg], (type: Constructor<Composite>) => {
    const options: ComponentOptionsUnion = arg instanceof Function ? {} : arg;
    markAsComponent(type);
    isolate(type);
    addOneWayBindingsProcessor(type);
    patchAppend(type);
    if (options.factory) {
      return asFactory(type);
    }
    return type;
  });
}

function isolate(type: BaseConstructor<Widget>) {
  if (type.prototype.children !== returnEmptyCollection) {
    type.prototype.children = returnEmptyCollection;
  }
}

function addOneWayBindingsProcessor(type: BaseConstructor<Widget>): void {
  const handlers = postAppendHandlers(type.prototype);
  if (handlers.indexOf(oneWayBindingsProcessor) === -1) {
    handlers.push(oneWayBindingsProcessor);
  }
}

function oneWayBindingsProcessor(base: WidgetInterface) {
  base._find().forEach(child => processOneWayBindings(base, child));
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
