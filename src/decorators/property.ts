import {CompareMode} from '../api/equals';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {applyDecorator} from '../internals/utils';
import {TypeGuard, UserType} from '../internals/utils-databinding';

export type CustomPropertyDecorator<T> = <
  Name extends keyof Target,
  Target extends {[key in Name]: T | unknown},
>(target: Target, property: Name) => void;

export type Converter<T> = 'off' | 'auto' | ((value: unknown) => T);

export type PropertyDecoratorConfig<T> = TypeGuard<T> | UserType<T> | PropertySuperConfig<T>;

export type PropertySuperConfig<T> = {
  typeGuard?: TypeGuard<T>,
  type?: UserType<T>,
  convert?: Converter<T>,
  equals?: CompareMode,
  nullable?: boolean,
  default?: T
};

/**
 * This decorator makes an instance property fire change events, thereby making it bindable.
 *
 * `@property` can be used on any class. A matching change event may (optionally)
 * be declared explicitly to be able to attach listeners. Example:
 *
 * ```ts
 * ‍@property myText: string;
 * ‍@event readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * *Notes:*
 * * *In TypeScript files `@property` will perform implicit value checks for most types.*
 * * *In JavaScript files `@property({type: Type})` can be used to enable the same
 *   kind of value checks.*
 * * *Use `@property(typeGuard)` or `@property({typeGuard: typeGuard})`
 *   to perform explicit value checks in either TypeScript or JavaScript.*
 */
export function property(targetProto: object, propertyName: string | symbol): void;

/**
 * This decorator makes an instance property fire change events, thereby making it bindable.
 *
 * `@property` can be used on any class. A matching change event may (optionally)
 * be declared explicitly to be able to attach listeners. Example:
 *
 * ```ts
 * ‍@property myText: string;
 * ‍@event readonly onMyTextChanged: ChangeListeners<MyComponent, 'myText'>;
 * ```
 *
 * *Notes:*
 * * *In TypeScript files `@property` will perform implicit value checks for most types.*
 * * *In JavaScript files `@property({type: Type})` can be used to enable the same
 *   kind of value checks.*
 * * *Use `@property(typeGuard)` or `@property({typeGuard: typeGuard})`
 *   to perform explicit value checks in either TypeScript or JavaScript.*
 */
export function property<T>(check: PropertyDecoratorConfig<T>): CustomPropertyDecorator<T>;

export function property(...args: any[]): PropertyDecorator | void {
  return applyDecorator('property', args, (proto: object, propertyName: string) => {
    CustomPropertyDescriptor.get(proto, propertyName as keyof typeof proto).addConfig({
      typeGuard: getTypeGuard(args[0]),
      type: getUserType(args[0]),
      convert: getConverter(args[0]),
      equals: getCompareMode(args[0]),
      default: getDefaultValue(args[0]),
      nullable: getNullable(args[0])
    });
  });
}

function getTypeGuard(arg: unknown): TypeGuard<any> | null {
  if (arg instanceof Function) {
    return arg as TypeGuard<any>;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).typeGuard || null;
  }
  return null;
}

function getUserType(arg: unknown): UserType<any> | null {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).type || null;
  }
  return null;
}

function getCompareMode(arg: unknown): CompareMode {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).equals || null;
  }
  return null;
}

function getConverter(arg: unknown): (v: any) => any {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).convert || null;
  }
  return null;
}

function getNullable(arg: unknown): boolean | null {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object && 'nullable' in arg) {
    return (arg as any).nullable;
  }
  return null;
}

function getDefaultValue(arg: unknown): any {
  if (arg instanceof Function) {
    return undefined;
  }
  if (arg instanceof Object && arg.constructor === Object && 'default' in arg) {
    return (arg as any).default;
  }
  return undefined;
}
