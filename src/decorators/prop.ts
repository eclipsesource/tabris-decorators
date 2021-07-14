import {CompareMode} from '../api/equals';
import {CustomPropertyDecorator, PropertyDecoratorConfig} from '../decorators/property';
import {autoDefault, CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {applyDecorator, BaseConstructor, isPrimitiveType} from '../internals/utils';
import {TypeGuard, UserType} from '../internals/utils-databinding';

/**
 * This decorator makes an instance property fire change events, thereby making it bindable.
 *
 * `@prop` can be used on any class. A matching change event may (optionally)
 * be declared explicitly to be able to attach listeners. Example:
 *
 * ```ts
 * ‍@prop myText: string;
 * ‍@event readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * *Notes:*
 * * *In TypeScript files `@prop` will perform implicit value checks for most types.*
 * * *In JavaScript files `@prop({type: Type})` or `@prop(Type)` can be used to enable the same
 *   kind of value checks.*
 * * *`@prop(config)` supports all the same options as `@property(config)`, but uses different defaults.*
 */
export function prop(targetProto: object, propertyName: string | symbol): void;
/**
 * This decorator makes an instance property fire change events, thereby making it bindable.
 *
 * `@prop` can be used on any class. A matching change event may (optionally)
 * be declared explicitly to be able to attach listeners. Example:
 *
 * ```ts
 * ‍@prop myText: string;
 * ‍@event readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * *Notes:*
 * * *In TypeScript files `@prop` will perform implicit value checks for most types.*
 * * *In JavaScript files `@prop({type: Type})` or `@prop(Type)` can be used to enable the same
 *   kind of value checks.*
 * * *`@prop(config)` supports all the same options as `@property(config)`, but uses different defaults.*
 */
export function prop<T>(check: PropertyDecoratorConfig<T>): CustomPropertyDecorator<T>;
export function prop(...args: any[]): PropertyDecorator | void {
  return applyDecorator('prop', args, (proto: object, propertyName: string) => {
    const property = CustomPropertyDescriptor.get(proto, propertyName as keyof typeof proto);
    property.addConfig({
      typeGuard: getTypeGuard(args[0]),
      type: getUserType(args[0]),
      convert: getConverter(args[0]),
      equals: getCompareMode(args[0]),
      default: getDefaultValue(args[0])
    });
    property.addConfig({
      nullable: getNullable(args[0], property.type)
    });
  });
}

function getTypeGuard(arg: unknown): TypeGuard<any> | null {
  if (arg instanceof Function) {
    return null;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).typeGuard || null;
  }
  return null;
}

function getUserType(arg: unknown): UserType<any> | null {
  if (arg instanceof Function) {
    return arg as UserType<any>;
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).type || null;
  }
  return null;
}

function getCompareMode(arg: unknown): CompareMode {
  if (arg instanceof Function) {
    return 'auto';
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).equals || 'auto';
  }
  return 'auto';
}

function getConverter(arg: unknown): ((v: any) => any) | 'auto' {
  if (arg instanceof Function) {
    return 'auto';
  }
  if (arg instanceof Object && arg.constructor === Object) {
    return (arg as any).convert || 'auto';
  }
  return 'auto';
}

function getNullable(arg: unknown, type: BaseConstructor<any>): boolean {
  if (arg instanceof Function) {
    return !isPrimitiveType(type);
  }
  if (arg instanceof Object && arg.constructor === Object && 'nullable' in arg) {
    return !!(arg as any).nullable;
  }
  return !isPrimitiveType(type);
}

function getDefaultValue(arg: unknown): any {
  if (arg instanceof Function) {
    return autoDefault;
  }
  if (arg instanceof Object && arg.constructor === Object && 'default' in arg) {
    return (arg as any).default;
  }
  return autoDefault;
}
