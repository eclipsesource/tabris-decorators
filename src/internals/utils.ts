import { Composite, Listeners, NativeObject, Selector, Widget, WidgetCollection } from 'tabris';

const uncheckedProperty: unique symbol = Symbol();
const changeEventsSupport: unique symbol = Symbol();
const postAppendHandlersKey = Symbol();
const wasAppendedKey = Symbol();
const propertyStoreKey = Symbol();
const paramInfoKey = Symbol();
const componentKey = Symbol();
export const originalAppendKey = Symbol();

// tslint:disable-next-line:ban-types
export type BaseConstructor<T> = Function & { prototype: T };
export type Constructor<T> = new(...args: any[]) => T;
export type ParameterDecoratorFactory = (target: Constructor<any>, property: string, index: number) => void;
export type ClassDecoratorFactory<T> = (type: Constructor<T>) => void;
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
export type DecoratorFactory = (target: any, property: string, index?: number) => void;

/**
 * Takes a callback a decorator factory and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the factory with an
 * appropriate error message.
 */
export function applyDecorator(name: string, args: any[], factory: DecoratorFactory): DecoratorFactory | void {
  let impl = (widgetProto: any, property: string, index: number) => {
    try {
      factory(widgetProto, property, index);
    } catch (error) {
      let target = property ? `"${property}"` : `parameter ${index} of ${widgetProto.name} constructor`;
      throw new Error(`Could not apply decorator "${name}" to ${target}: ${error.message}`);
    }
  };
  if (areStaticDecoratorArgs(args)) {
    impl(args[0], args[1], args[2]);
  } else {
    return impl;
  }
}

/**
 * Takes a callback a class decorator factory and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the factory with an
 * appropriate error message.
 */
export function applyClassDecorator<T>(
  name: string,
  args: any[],
  factory: ClassDecoratorFactory<T>
): ClassDecoratorFactory<T> | void {
  let impl = (type: Constructor<any>) => {
    try {
      factory(type);
    } catch (error) {
      throw new Error(`Could not apply decorator "${name}" to "${type.name}": ${error.message}`);
    }
  };
  if (areStaticClassDecoratorArgs(args)) {
    impl(args[0]);
  } else {
    return impl;
  }
}

/**
 * Determines whether a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
 * or without (static, e.g. "@foo").
 */
export function areStaticDecoratorArgs(args: any[]): boolean {
  let hasClassTarget = (typeof args[0] === 'function') && !!args[0].prototype;
  let hasProtoTarget = (typeof args[0] === 'object') && !!args[0].constructor;
  return (hasClassTarget || hasProtoTarget) && args.length >= 2;
}

/**
 * Determines whether a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
 * or without (static, e.g. "@foo").
 */
export function areStaticClassDecoratorArgs(args: any[]): boolean {
  return typeof args[0] === 'function' && args.length === 1;
}

/**
 * Defines the a getter on the given prototype. If the prototype already has a getter or setter of that name the
 * function throws.
 */
export function defineGetter(proto: any, property: string, get: () => any): void {
  if (Object.getOwnPropertyDescriptor(proto, property)) {
    throw new Error('A getter or setter was already defined.');
  }
  Object.defineProperty(proto, property, {
    get,
    enumerable: true,
    configurable: true
  });
}

/**
 * Gets the type of the property. If the type can not be represented properly at runtime
 * it returns the Object constructor.
 */
export function getPropertyType(proto: any, property: string): Constructor<any> {
  let result = Reflect.getMetadata('design:type', proto, property);
  if (!result) {
    throw new Error('Property type is undefined: Do you have circular dependency issues?');
  }
  return result;
}

/**
 * Gets the type of the parameter. If the type can not be represented properly at runtime this throw an error.
 */
export function getParameterType(fn: any, index: number): Constructor<any> {
  let result = Reflect.getMetadata('design:paramtypes', fn)[index];
  if (result === Object) {
    throw new Error('Parameter type could not be inferred. Only classes and primitive types are supported.');
  }
  if (!result) {
    throw new Error('Parameter type is undefined: Do you have circular dependency issues?');
  }
  return result;
}

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

/**
 * Gets array of injection data for each parameter of the given function
 * For non exists it will be created
 */
export function getOwnParamInfo(fn: any): ParamInfo[] {
  if (!Reflect.getOwnMetadata(paramInfoKey, fn)) {
    Reflect.defineMetadata(paramInfoKey, [], fn);
  }
  return Reflect.getOwnMetadata(paramInfoKey, fn);
}

/**
 * Gets array of injection data for each parameter of the given function
 * If non exist and the function is a constructor, the super constructor will checked.
 * If non exists in the entire chain, null will be returned.
 */
export function getParamInfo(fn: any): ParamInfo[] | null {
  if (!Reflect.getMetadata(paramInfoKey, fn)) {
    return null;
  }
  return Reflect.getMetadata(paramInfoKey, fn);
}

export function hasInjections(fn: any): boolean {
  const paramInfoArr = getParamInfo(fn);
  if (!paramInfoArr || !paramInfoArr.length) {
    return false;
  }
  for (let paramInfo of paramInfoArr) {
    if (paramInfo && paramInfo.inject) {
      return true;
    }
  }
  return false;
}

export function checkPropertyExists(targetWidget: any, targetProperty: string, targetName: string = 'Target') {
  if (!(targetProperty in targetWidget)) {
    throw new Error(`${targetName} does not have a property "${targetProperty}".`);
  }
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
