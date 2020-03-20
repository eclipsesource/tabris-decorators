import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {applyDecorator} from '../internals/utils';
import {TypeGuard, UserType} from '../internals/utils-databinding';

export type CustomPropertyDecorator<T> = <
  Name extends keyof Target,
  Target extends {[key in Name]: T},
>(target: Target, property: Name) => void;

export type PropertyDecoratorConfig<T> = TypeGuard<T> | UserType<T> | {
  typeGuard?: TypeGuard<T>,
  type?: UserType<T>
};

export type PropertySuperConfig<T> = {
  typeGuard?: TypeGuard<T>,
  type?: UserType<T>
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
      type: getUserType(args[0])
    });
  });
}

function getUserType(arg: unknown): UserType<any> | null{
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).type || null;
  }
  return null;
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
