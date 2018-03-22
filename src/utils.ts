import { Widget } from 'tabris';
import { WidgetCollection } from 'tabris';
import { Injector } from './Injector';

export interface ParamInfo {type: Constructor<any>; injectParam?: string; injector: Injector; }
export interface Constructor<T> {new(...args: any[]): T; }
export interface WidgetProtected {
  _find(selector?: Selector): WidgetCollection<Widget>;
  _find<U extends Widget>(constructor: { new (...args: any[]): U }): WidgetCollection<U>;
}
// tslint:disable-next-line:ban-types
export type BaseConstructor<T> = Function & { prototype: T };
export type WidgetConstructor = Constructor<Widget>;
export type DecoratorFactory = (target: any, property: string, index?: number) => void;
export type ParameterDecoratorFactory = (target: Constructor<any>, property: string, index: number) => void;
export type ClassDecoratorFactory<T> = (type: Constructor<T>) => void;
export type PostAppendHandler = (widgetInstance: WidgetInterface) => void;
export type WidgetInterface = {[prop: string]: any} & Widget & WidgetProtected;

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
  let hasTarget = typeof args[0] === 'object' || typeof args[0] === 'function';
  let hasParam = typeof args[1] === 'string' || typeof args[2] === 'number';
  return hasTarget && hasParam && args.length === 3;
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
  return Reflect.getMetadata('design:type', proto, property);
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
 */
export function getParamInfo(fn: any): ParamInfo[] {
  if (!Reflect.getMetadata(paramInfoKey, fn)) {
    Reflect.defineMetadata(paramInfoKey, [], fn);
  }
  return Reflect.getMetadata(paramInfoKey, fn);
}

export function checkBindableType(property: string, type: Constructor<any>) {
  if (type === Object) {
    throw new Error(`Type of "${property}" could not be inferred. `
      + 'Only classes and primitive types are supported.');
  }
}

export function checkPropertyExists(targetWidget: any, targetProperty: string, targetName: string = 'Target') {
  if (!(targetProperty in targetWidget)) {
    throw new Error(`${targetName} does not have a property "${targetProperty}".`);
  }
}

export function markAsAppended(widget: WidgetInterface) {
  widget[wasAppendedKey] = true;
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
  if (/this/.test(targetPath)) {
    throw new Error('Binding path contains reserved word "this".');
  }
}

export function isAppended(widget: WidgetInterface) {
  return !!widget[wasAppendedKey];
}

export function markAsComponent(type: BaseConstructor<Widget>) {
  Reflect.defineMetadata(componentKey, true, type.prototype);
}

export function checkIsComponent(widget: Widget) {
  if (!Reflect.getMetadata(componentKey, widget)) {
    throw new Error(`${widget.constructor.name} is not a @component`);
  }
}

export class ChangeEvent<T> {

  public target: T;

  public type: string;

  public value: any;

  public timeStamp: number = Date.now();

  constructor(target: T, type: string, value: any) {
    this.target = target;
    this.type = type;
    this.value = value;
  }

}

/* Internals */

const postAppendHandlersKey = Symbol();
const wasAppendedKey = Symbol();
const propertyStoreKey = Symbol();
const paramInfoKey = Symbol();
const componentKey = Symbol();
