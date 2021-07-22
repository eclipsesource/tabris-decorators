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

export type PropertyInitializer<Proto extends object, TargetType>
  =  (instance: Proto, descriptor: CustomPropertyDescriptor<Proto, TargetType>) => Proto;

export type PropertySuperConfig<T> = {
  typeGuard?: TypeGuard<T>,
  type?: UserType<T>,
  convert?: Converter<T>,
  equals?: CompareMode,
  nullable?: boolean,
  default?: T,
  observe?: boolean
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
 * * *Use `@property({default: value})` to define the property default value.
 * * *Use `@property({nullable: false})` to disallow `null` and `undefined`values.
 * * *Use `@property({equals: 'auto'})` to relax equality check for objects.
 * * *Use `@property({convert: 'auto'})` to automatically convert the value to the property's type.
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
 * ‍@event readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * *Notes:*
 * * *In TypeScript files `@property` will perform implicit value checks for most types.*
 * * *In JavaScript files `@property({type: Type})` can be used to enable the same
 *   kind of value checks.*
 * * *Use `@property(typeGuard)` or `@property({typeGuard: typeGuard})`
 *   to perform explicit value checks in either TypeScript or JavaScript.*
 * * *Use `@property({default: value})` to define the property default value.
 * * *Use `@property({nullable: false})` to disallow `null` and `undefined`values.
 * * *Use `@property({equals: 'auto'})` to relax equality check for objects.
 * * *Use `@property({convert: 'auto'})` to automatically convert the value to the property's type.
 * * *Use `@property({observe: true})` to propagate change events from the assigned object
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
      nullable: getNullable(args[0]),
      observe: getObserve(args[0])
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

function getObserve(arg: unknown): boolean {
  if (arg instanceof Function) {
    return false;
  }
  if (arg instanceof Object && arg.constructor === Object && 'observe' in arg) {
    return !!(arg as any).observe;
  }
  return false;
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
