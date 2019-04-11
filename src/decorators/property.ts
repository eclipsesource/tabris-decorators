import { Listeners, Widget } from 'tabris';
import { checkType } from '../api/checkType';
import { TypeGuard } from '../index';
import { applyDecorator, Constructor, getPropertyStore, getPropertyType, markAsUnchecked } from '../internals/utils';

export type CustomPropertyDecorator = (target: object, property: string | symbol) => void;

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
export function property(targetProto: object, property: string | symbol): void;
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
export function property(check: TypeGuard): CustomPropertyDecorator;
export function property(...args: any[]): PropertyDecorator | void {
  return applyDecorator('property', args, (widgetProto: any, propertyName: string) => {
    const changeEvent = propertyName + 'Changed';
    const listenerProperty = 'on' + changeEvent.charAt(0).toUpperCase() + changeEvent.slice(1);
    const targetType = getPropertyType(widgetProto, propertyName);
    const check = args[0] instanceof Function ? args[0] : null;
    const unchecked = targetType === Object && !check;
    if (unchecked) {
      markAsUnchecked(widgetProto, propertyName);
    }
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
            setterTypeCheck(propertyName, value, targetType, check);
          }
          getPropertyStore(this).set(propertyName, value);
          const listeners: any = target[listenerProperty];
          if (target instanceof Widget) {
            target.trigger(changeEvent, {value});
          } else if (listeners && listeners.original instanceof Listeners) {
            listeners.trigger({value});
          }
        }
      },
      enumerable: true,
      configurable: true
    });
  });
}

function setterTypeCheck(
  propertyName: string, value: any, targetType: Constructor<any>, check: TypeGuard
) {
  try {
    if (check) {
      if (!check(value)) {
        throw new Error(`Type guard check failed`);
      }
    } else {
      checkType(value, targetType);
    }
  } catch (ex) {
    throw new Error(`Failed to set property "${propertyName}": ${ex.message}`);
  }
}
