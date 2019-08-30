import { Composite, Listeners, NativeObject, Selector, Widget, WidgetCollection } from 'tabris';
import { BaseConstructor, Constructor } from './utils';

const uncheckedProperty: unique symbol = Symbol();
const changeEventsSupport: unique symbol = Symbol();
const postAppendHandlersKey = Symbol();
const wasAppendedKey = Symbol();
const propertyStoreKey = Symbol();
const componentKey = Symbol();

export const originalAppendKey = Symbol();

export type EventTarget = {
  [changeEventsSupport]: {[prop: string]: true|undefined}
};
export type WidgetInterface = {
  [originalAppendKey]: typeof Composite.prototype.append,
  [wasAppendedKey]: boolean,
  [uncheckedProperty]: any,
  [prop: string]: any
} & Widget & WidgetProtected & EventTarget;
export type TypeGuard = (v: any) => boolean;
export interface WidgetProtected {
  _find(selector?: Selector): WidgetCollection<Widget>;
  _find<U extends Widget>(constructor: new (...args: any[]) => U): WidgetCollection<U>;
}
export interface ParamInfo {type: Constructor<any>; injectParam?: string; inject?: boolean;}
export type PostAppendHandler = (widgetInstance: WidgetInterface) => void;

/**
 * Gets list of functions to be executed after first time append is called on instances of the given
 * widget prototype or instance.
 */
export function postAppendHandlers(widget: WidgetInterface) {
  if (!Reflect.getMetadata(postAppendHandlersKey, widget)) {
    Reflect.defineMetadata(postAppendHandlersKey, [], widget);
  }
  return Reflect.getMetadata(postAppendHandlersKey, widget) as PostAppendHandler[];
}

/**
 * Gets map for the purpose of storing property values of the given instance.
 */
export function getPropertyStore(instance: any): Map<string | symbol, any> {
  if (!instance[propertyStoreKey]) {
    instance[propertyStoreKey] = new Map<string | symbol, any>();
  }
  return instance[propertyStoreKey];
}

export function checkPropertyExists(targetWidget: any, targetProperty: string, targetName: string = 'Target') {
  let current = targetWidget;
  while (current) {
    const desc = Object.getOwnPropertyDescriptor(current, targetProperty);
    if (desc) {
      if (!desc.set) {
        throw new Error(`${targetName} property "${targetProperty}" does not perform type checks.`);
      }
      return;
    }
    current = Object.getPrototypeOf(current);
  }
  throw new Error(`${targetName} does not have a property "${targetProperty}".`);
}

export function markAsUnchecked(widget: WidgetInterface, targetProperty: string) {
  if (!widget[uncheckedProperty]) {
    widget[uncheckedProperty] = {};
  }
  widget[uncheckedProperty][targetProperty] = true;
}

export function isUnchecked(widget: WidgetInterface, targetProperty: string) {
  return widget[uncheckedProperty] && widget[uncheckedProperty][targetProperty];
}

export function markSupportsChangeEvents(target: Partial<EventTarget>, targetProperty: string) {
  if (!target[changeEventsSupport]) {
    target[changeEventsSupport] = {};
  }
  (target as EventTarget)[changeEventsSupport][targetProperty] = true;
}

export function supportsChangeEvents(target: Partial<EventTarget>, targetProperty: string): boolean {
  if (target instanceof NativeObject) {
    return true; // anyone could fire change events
  }
  const changeEvent = targetProperty + 'Changed';
  const listenerProperty = 'on' + changeEvent.charAt(0).toUpperCase() + changeEvent.slice(1);
  const listeners: any = target[listenerProperty];
  if (listeners && listeners.original instanceof Listeners) {
    if (listeners.original.target !== target || listeners.original.type !== changeEvent) {
      throw new Error(listenerProperty + ' has wrong target or event type');
    }
    return true;
  }
  return !!(target[changeEventsSupport] && (target as EventTarget)[changeEventsSupport][targetProperty]);
}

export function trigger(target: Partial<EventTarget>, type: string, eventData: any) {
  Listeners.getListenerStore(target).trigger(type, eventData);
}

export function markAsAppended(widget: WidgetInterface) {
  widget[wasAppendedKey] = true;
}

export function isAppended(widget: WidgetInterface) {
  return !!widget[wasAppendedKey];
}

export function checkAppended(widget: WidgetInterface) {
  if (!isAppended(widget)) {
    throw new Error(`No widgets have been appended yet.`);
  }
}

export function parseTargetPath(path: string) {
  checkPathSyntax(path);
  if (!path.startsWith('#')) {
    throw new Error('Binding path needs to start with "#".');
  }
  const segments = path.split('.');
  if (segments.length < 2) {
    throw new Error('Binding path needs at least two segments.');
  } else if (segments.length > 2) {
    throw new Error('Binding path has too many segments.');
  }
  const [selector, targetProperty] = segments;
  return {selector, targetProperty};
}

export function checkPathSyntax(targetPath: string) {
  if (/\s|\[|\]|\(|\)|\<|\>/.test(targetPath)) {
    throw new Error('Binding path contains invalid characters.');
  }
}

export function markAsComponent(type: BaseConstructor<Widget>) {
  Reflect.defineMetadata(componentKey, true, type.prototype);
}

export function checkIsComponent(widget: Widget) {
  if (!Reflect.getMetadata(componentKey, widget)) {
    throw new Error(`${widget.constructor.name} is not a @component`);
  }
}

export function getChild(base: WidgetInterface, selector: string) {
  let results = (base as any)._find(selector) as WidgetCollection<Widget>;
  if (results.length === 0) {
    throw new Error(`No widget matching "${selector}" was appended.`);
  } else if (results.length > 1) {
    throw new Error(`Multiple widgets matching "${selector}" were appended.`);
  }
  return results.first() as WidgetInterface;
}
