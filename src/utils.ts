import {Widget} from 'tabris';

export interface WidgetConstructor { new (...args: any[]): Widget; }
export type DecoratorFactory = (widgetProto: any, property: string) => void;
export type WidgetInterface = {[prop: string]: any} & Widget;
export type Initializer = (widgetInstance: WidgetInterface) => void;

/**
 * Takes a callback a property decorator factory and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the factory with an
 * apropriate error message.
 */
export function applyPropertyDecorator(name: string, args: any[], factory: DecoratorFactory): DecoratorFactory | void {
  let impl = (widgetProto: any, property: string) => {
    try {
      factory(widgetProto, property);
    } catch (error) {
      throw new Error(`Could not apply decorator "${name}" to property "${property}": ${error.message}`);
    }
  };
  if (areStaticDecoratorArgs(args)) {
    impl(args[0], args[1]);
  } else {
    return impl;
  }
}

/**
 * Determines wheter a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
 * or without (static, e.g. "@foo").
 */
export function areStaticDecoratorArgs(args: any[]): boolean {
  return typeof args[0] === 'object';
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
 * Gets the type of the property. If the type can not be represented properly at runtime this will return null
 * instead of the object constructor.
 */
export function getPropertyType(proto: any, property: string): any {
  let result = Reflect.getMetadata('design:type', proto, property);
  return result === Object ? null : result;
}

/**
 * Gets list of functions to be executed after first time append is called on instances of the given
 * widget prototype or instance.
 */
export function initializers(widget: WidgetInterface) {
  patchAppend(widget);
  if (!widget[initializersKey]) {
    widget[initializersKey] = [];
  }
  return widget[initializersKey] as Initializer[];
}

/**
 * Gets map for the prupose of string property values of the given instance.
 */
export function getPropertyStore(instance: any): Map<string, any> {
  if (!instance[propertyStoreKey]) {
    instance[propertyStoreKey] = new Map<string, any>();
  }
  return instance[propertyStoreKey];
}

export function isInitialized(widget: WidgetInterface) {
  return !!widget[isInitializedKey];
}

function patchAppend(widgetProto: WidgetInterface) {
  if (widgetProto.append !== customAppend) {
    widgetProto[originalAppendKey] = widgetProto.append;
    widgetProto.append = customAppend;
  }
}

function customAppend(this: WidgetInterface): any {
  let result = this[originalAppendKey].apply(this, arguments);
  initialize(this);
  return result;
}

function initialize(widgetInstance: WidgetInterface) {
  if (widgetInstance[isInitializedKey]) {
    return;
  }
  for (let init of initializers(widgetInstance)) {
    init(widgetInstance);
  }
  widgetInstance[isInitializedKey] = true;
}

const initializersKey = Symbol();
const isInitializedKey = Symbol();
const originalAppendKey = Symbol();
const propertyStoreKey = Symbol();
