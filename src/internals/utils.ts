
export type BaseConstructor<T> = Function & { prototype: T };
export type Constructor<T> = new(...args: any[]) => T;
export type ParameterDecoratorFactory = (target: Constructor<any>, property: string, index: number) => void;
export type ClassDecoratorFactory<T> = (type: Constructor<T>) => void;
export type CustomPropertiesInfo<T extends object> = {[prop in keyof T]?: PropInfo};
export interface ParamInfo {type: Constructor<any>; injectParam?: string; inject?: boolean;}
export interface PropInfo {inject: boolean;}
export type Decorator<T> = (target: T, property?: string, index?: number) => T | void;

const paramInfoKey = Symbol('paramInfoKey');
const propInfoKey = Symbol('propInfoKey');

/**
 * Takes a callback a decorator function and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the function with an
 * appropriate error message.
 */
export function applyDecorator<T>(name: string, args: any[], decorator: Decorator<T>): any {
  const impl = (widgetProto: any, property: string, index: number) => {
    try {
      return decorator(widgetProto, property, index);
    } catch (error) {
      const target =
        property ? `"${property}"` :
          index !== undefined ? `parameter ${index} of ${widgetProto.name} constructor` :
            `class ${widgetProto.name}`;
      throw new Error(`Could not apply decorator "${name}" to ${target}: ${error.message}`);
    }
  };
  if (decorator.length === 1 ? areStaticClassDecoratorArgs(args) : areStaticDecoratorArgs(args)) {
    return impl(args[0], args[1], args[2]);
  } else {
    return impl;
  }
}

/**
 * Determines whether a decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
 * or without (static, e.g. "@foo").
 */
export function areStaticDecoratorArgs(args: any[]): boolean {
  const hasClassTarget = (typeof args[0] === 'function') && !!args[0].prototype;
  const hasProtoTarget = (typeof args[0] === 'object') && !!args[0].constructor;
  const hasName = typeof args[1] === 'string';
  return (hasClassTarget || hasProtoTarget) && hasName;
}

/**
 * Determines whether a class decorator was applied with arguments (dynamic, e.g. "@foo(1,2,2)")
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
 * Gets the type (constructor) of the property as emitted by tsc.
 * Returns the Object constructor if the type can not be represented
 * by tsc properly at runtime, OR if the compiler option
 * emitDecoratorMetadata is not enabled.
 */
export function getPropertyType(proto: any, property: string): Constructor<any> {
  return Reflect.getMetadata('design:type', proto, property) || Object;
}

/**
 * Returns true if type information was emitted by tsc for this property.
 */
export function hasPropertyType(proto: any, property: string): boolean {
  return !!Reflect.getMetadata('design:type', proto, property);
}

/**
 * Gets the type of the parameter. If the type can not be represented properly at runtime this throw an error.
 */
export function getParameterType(fn: any, index: number): Constructor<any> {
  const result = Reflect.getMetadata('design:paramtypes', fn)[index];
  if (result === Object) {
    throw new Error('Parameter type could not be inferred. Only classes and primitive types are supported.');
  }
  if (!result) {
    throw new Error('Parameter type is undefined: Do you have circular module dependencies?');
  }
  return result;
}

/**
 * Gets array of injection data for each parameter of the given function
 * If none exists it will be created
 */
export function getOwnParamInfo(fn: any): ParamInfo[] {
  if (!Reflect.getOwnMetadata(paramInfoKey, fn)) {
    Reflect.defineMetadata(paramInfoKey, [], fn);
  }
  return Reflect.getOwnMetadata(paramInfoKey, fn);
}

/**
 * Gets array of injection data for each parameter of the given function
 * If none exist and the function is a constructor, the super constructor will checked.
 * If none exists in the entire chain, null will be returned.
 */
export function getParamInfo(fn: any): ParamInfo[] | null {
  if (!Reflect.getMetadata(paramInfoKey, fn)) {
    // eslint-disable-next-line no-undef
    const orgComponentSym = (window as any).tabris.symbols.originalComponent;
    if (fn[orgComponentSym]) {
      return Reflect.getMetadata(paramInfoKey, fn[orgComponentSym]);
    }
    return null;
  }
  return Reflect.getMetadata(paramInfoKey, fn);
}

export function getCustomProperties<T extends object>(target: T): CustomPropertiesInfo<T> {
  const result: CustomPropertiesInfo<T> = {};
  for (const prop of Reflect.getMetadataKeys(target, propInfoKey)) {
    result[prop] = getPropertyInfo(target, prop);
  }
  return result;
}

export function getPropertyInfo<T extends object>(target: T, prop: keyof T): PropInfo {
  if (typeof prop !== 'string') {
    throw new Error('Can not get property info on symbol');
  }
  if (!Reflect.getMetadata(prop, target, propInfoKey)) {
    Reflect.defineMetadata(prop, {}, target, propInfoKey);
  }
  return Reflect.getMetadata(prop, target, propInfoKey);
}

export function hasInjections(fn: any): boolean {
  const paramInfoArr = getParamInfo(fn);
  if (!paramInfoArr || !paramInfoArr.length) {
    return false;
  }
  for (const paramInfo of paramInfoArr) {
    if (paramInfo && paramInfo.inject) {
      return true;
    }
  }
  return false;
}

export function isPrimitiveType(type: BaseConstructor<any>) {
  return type === Boolean || type === Number || type === String;
}
