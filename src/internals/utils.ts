export type BaseConstructor<T> = Function & { prototype: T };
export type Constructor<T> = new(...args: any[]) => T;
export type ParameterDecoratorFactory = (target: Constructor<any>, property: string, index: number) => void;
export type ClassDecoratorFactory<T> = (type: Constructor<T>) => void;
export interface ParamInfo {type: Constructor<any>; injectParam?: string; inject?: boolean;}
export type DecoratorFactory = (target: any, property: string, index?: number) => void;

const paramInfoKey = Symbol();

/**
 * Takes a callback a decorator factory and when possible calls it with the appropriate arguments,
 * or returns it so it can be can be called later. Rethrows exceptions by the factory with an
 * appropriate error message.
 */
export function applyDecorator(name: string, args: any[], factory: DecoratorFactory): DecoratorFactory | void {
  const impl = (widgetProto: any, property: string, index: number) => {
    try {
      factory(widgetProto, property, index);
    } catch (error) {
      const target = property ? `"${property}"` : `parameter ${index} of ${widgetProto.name} constructor`;
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
  const impl = (type: Constructor<any>) => {
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
  const hasClassTarget = (typeof args[0] === 'function') && !!args[0].prototype;
  const hasProtoTarget = (typeof args[0] === 'object') && !!args[0].constructor;
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
  const result = Reflect.getMetadata('design:type', proto, property);
  if (!result) {
    throw new Error('Property type is undefined: Do you have circular dependency issues?');
  }
  return result;
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
    throw new Error('Parameter type is undefined: Do you have circular dependency issues?');
  }
  return result;
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
