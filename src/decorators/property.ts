import {checkType} from '../api/checkType';
import {applyDecorator, Constructor, getPropertyType} from '../internals/utils';
import {getPropertyStore, markAsUnchecked, markSupportsChangeEvents, trigger, TypeGuard, UserType} from '../internals/utils-databinding';

export type CustomPropertyDecorator<T> = <
  Name extends keyof Target,
  Target extends {[key in Name]: T},
>(target: Target, property: Name) => void;

export type PropertyDecoratorConfig<T> = TypeGuard<T> | UserType<T> | {
  typeGuard?: TypeGuard<T>,
  type?: UserType<T>
};

// Duplicate JsDoc is needed because of the function overload:

/**
 * This decorator makes a property fire change events, thereby making it bindable.
 *
 * `@property` can be used on any class, but on non-widget classes change events are only
 * fired when a matching event is declared:
 * ```ts
 * ‍@property public myText: string;
 * ‍@event public readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * The decorator can optionally also attach a type guard function to the property:
 * ```
 * ‍@property(value => boolean)
 * ```
 * The type guard is called whenever the property is set and must return `true`
 * if `value` is of the expected type. This is required for some types to enable databinding.
 */
export function property(targetProto: object, propertyName: string | symbol): void;
/**
 * This decorator makes a property fire change events, thereby making it bindable.
 *
 * `@property` can be used on any class, but on non-widget classes change events are only
 * fired when a matching event is declared:
 * ```ts
 * ‍@property public myText: string;
 * ‍@event public readonly onMyTextChanged: ChangeListeners<string>;
 * ```
 *
 * The decorator can optionally also attach a type guard function to the property:
 * ```
 * ‍@property(value => boolean)
 * ```
 * The type guard is called whenever the property is set and must return `true`
 * if `value` is of the expected type. This is required for some types to enable databinding.
 */
export function property<T>(check: PropertyDecoratorConfig<T>): CustomPropertyDecorator<T>;
export function property(...args: any[]): PropertyDecorator | void {
  return applyDecorator('property', args, (widgetProto: any, propertyName: string) => {
    const changeEvent = propertyName + 'Changed';
    const targetType = getPropertyType(widgetProto, propertyName);
    const typeGuard = getTypeGuard(args[0]);
    const userType = getUserType(args[0]);
    const unchecked = targetType === Object && !typeGuard && !userType;
    if (unchecked) {
      markAsUnchecked(widgetProto, propertyName);
    }
    markSupportsChangeEvents(widgetProto, propertyName);
    Object.defineProperty(widgetProto, propertyName, {
      get() {
        const target: object = this;
        return getPropertyStore(target).get(propertyName);
      },
      set(value: any) {
        const target: object = this;
        const currentValue = getPropertyStore(this).get(propertyName);
        if (currentValue !== value) {
          if (!unchecked) {
            setterTypeCheck(propertyName, value, targetType, userType, typeGuard);
          }
          getPropertyStore(this).set(propertyName, value);
          trigger(target, changeEvent, {value});
        }
      },
      enumerable: true,
      configurable: true
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

function setterTypeCheck(
  propertyName: string, value: any, targetType: Constructor<any>, userType: UserType<any>, typeGuard: TypeGuard
) {
  try {
    if (userType) { // unlike meta-data type, userType is checked first and regardless of typeGuard
      checkType(value, userType);
    }
    if (typeGuard) {
      if (!typeGuard(value)) {
        throw new Error('Type guard check failed');
      }
    } else if (!userType) {
      checkType(value, targetType);
    }
  } catch (ex) {
    throw new Error(`Failed to set property "${propertyName}": ${ex.message}`);
  }
}
