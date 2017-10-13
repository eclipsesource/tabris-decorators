import {Widget} from 'tabris';

export interface Constructor<T> {new(...args: any[]): T; }
export interface ParamInfo {type: Constructor<any>; injectParam?: string; }
export interface PropertyInfo {
  type: Constructor<any>;
  optional?: boolean;
  converter?: (value: any) => any;
  fallback?: any;
  injectParam?: string;
}
export interface PropertyConfig {
  proto: any;
  property: string;
  processGet: (target: any, value: any) => any;
  processSet: (target: any, value: any) => any;
}
export type WidgetConstructor = Constructor<Widget>;
export type DecoratorFactory = (target: any, property: string, index?: number) => void;
export type ClassDecoratorFactory = (type: Constructor<any>) => void;
export type WidgetInterface = {[prop: string]: any} & Widget;
export type PostAppendHandler = (widgetInstance: WidgetInterface) => void;
export type WidgetResolver = (widget: WidgetInterface, param: string, type: WidgetConstructor) => any;

/**
 * Takes a callback a decorator factory and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the factory with an
 * apropriate error message.
 */
export function applyDecorator(name: string, args: any[], factory: DecoratorFactory): DecoratorFactory | void {
  let impl = (widgetProto: any, property: string, index: number) => {
    try {
      factory(widgetProto, property, index);
    } catch (error) {
      throw new Error(`Could not apply decorator "${name}" to "${property}": ${error.message}`);
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
 * apropriate error message.
 */
export function applyClassDecorator(
  name: string,
  args: any[],
  factory: ClassDecoratorFactory
): ClassDecoratorFactory | void {
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
 * Determines wheter a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
 * or without (static, e.g. "@foo").
 */
export function areStaticDecoratorArgs(args: any[]): boolean {
  let hasTarget = typeof args[0] === 'object' || typeof args[0] === 'function';
  let hasParam = typeof args[1] === 'string' || typeof args[2] === 'number';
  return hasTarget && hasParam && args.length === 3;
}

/**
 * Determines wheter a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
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
 * Defines a setter/getter on the given prototype. If the prototype already has a getter or setter of that name the
 * function throws. The value is automatically stored in the propertyStore
 */
export function defineProperty({proto, property, processSet, processGet}: PropertyConfig): void {
  if (Object.getOwnPropertyDescriptor(proto, property)) {
    throw new Error('A getter or setter was already defined.');
  }
  Object.defineProperty(proto, property, {
    get(this: any) {
      return processGet(this, getPropertyStore(this).get(property));
    },
    set(this: any, value: any) {
      getPropertyStore(this).set(property, processSet(this, value));
    },
    enumerable: true,
    configurable: true
  });
}

/**
 * Gets the type of the property. If the type can not be represented properly at runtime this throw an error.
 */
export function getPropertyType(proto: any, property: string): Constructor<any> {
  let result = Reflect.getMetadata('design:type', proto, property);
  if (result === Object) {
    throw new Error('Property type could not be inferred. Only classes and primitive types are supported.');
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
  return result;
}

/**
 * Throws if the given value is not of the given type. Primitives are represented by their boxed type.
 */
export function checkType<T>(value: T, type: Constructor<any>): T {
  if (value instanceof type || (typeof value === getTypeName(type))) {
    return value;
  }
  throw new Error(`Expected value to be of type "${getTypeName(type)}", but found "${getValueTypeName(value)}".`);
}

/**
 * Gets list of functions to be executed after first time append is called on instances of the given
 * widget prototype or instance.
 */
export function postAppendHandlers(widget: WidgetInterface) {
  patchAppend(widget);
  if (!widget[postAppendHandlersKey]) {
    widget[postAppendHandlersKey] = [];
  }
  return widget[postAppendHandlersKey] as PostAppendHandler[];
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

/**
 * Gets array of injection data for each parameter of the given function
 */
export function getParamInfo(fn: any): ParamInfo[] {
  if (!fn[paramInfoKey]) {
    fn[paramInfoKey] = [];
  }
  return fn[paramInfoKey];
}

/**
 * Gets map of data for each property
 */
export function getPropertyInfo(protoOrInstance: any): Map<string, PropertyInfo> {
  if (!protoOrInstance[propertyInfoKey]) {
    protoOrInstance[propertyInfoKey] = new Map<string, PropertyInfo>();
  }
  return protoOrInstance[propertyInfoKey];
}

/**
 * Checks if the post append handlers of this widget type have already been executed for the given instance.
 */
export function wasAppended(widget: WidgetInterface) {
  return !!widget[wasAppendedKey];
}

/**
 * Sets the initialized flag on this instance
 */
export function markInitialized(target: any) {
  target[initializedKey] = true;
}

/**
 * Sets the initialization failed flag on this instance
 */
export function markInitialionFailed(target: any) {
  target[initializationFailedKey] = true;
}

/**
 * Returns true if target has the initialized flag
 */
export function isInitialized(target: any) {
  return !!target[initializedKey];
}

/**
 * Returns true if target has the initialization failed flag
 */
export function failedToInitialize(target: any) {
  return !!target[initializationFailedKey];
}

/**
 * Returns either the "typeof" name of a primitive value, or the constructor name for an instance
 */
export function getValueTypeName(value: any) {
  if (value && value.constructor) {
    return getTypeName(value.constructor);
  }
  return typeof value;
}

/**
 * Returns either the "typeof" name of a boxed primitive type, or the constructor name for any other class
 */
export function getTypeName(type: Constructor<any>) {
  let name = type.name;
  if (isPrimitiveType(type)) {
    return name.toLowerCase();
  }
  return name;
}

/**
 * Return true if `value` is a number, string, or boolean.
 */
export function isPrimitiveValue(value: any) {
  let type = typeof value;
  return type === 'boolean' || type === 'number' || type === 'string';
}

/**
 * Return true if `type` is `Number`, `Boolean` or `String`.
 */
export function isPrimitiveType(type: Constructor<any>) {
  return type === Boolean || type === Number || type === String;
}

/* Internals */

function patchAppend(widgetProto: WidgetInterface) {
  if (widgetProto.append !== customAppend) {
    widgetProto[originalAppendKey] = widgetProto.append;
    widgetProto.append = customAppend;
  }
}

function customAppend(this: WidgetInterface): any {
  let result = this[originalAppendKey].apply(this, arguments);
  runPostAppendHandler(this);
  return result;
}

function runPostAppendHandler(widgetInstance: WidgetInterface) {
  if (widgetInstance[wasAppendedKey]) {
    return;
  }
  for (let fn of postAppendHandlers(widgetInstance)) {
    fn(widgetInstance);
  }
  widgetInstance[wasAppendedKey] = true;
}

const postAppendHandlersKey = Symbol();
const wasAppendedKey = Symbol();
const originalAppendKey = Symbol();
const propertyStoreKey = Symbol();
const propertyInfoKey = Symbol();
const initializedKey = Symbol();
const initializationFailedKey = Symbol();
const paramInfoKey = Symbol();
