import { Widget } from 'tabris';
import { ChangeEvent } from '../api/ChangeEvent';
import { checkType } from '../api/checkType';
import { TypeGuard } from '../index';
import { applyDecorator, Constructor, getPropertyStore, getPropertyType, markAsUnchecked, WidgetInterface } from '../internals/utils';

export type CustomPropertyDecorator = (target: Widget, property: string | symbol) => void;

export function property(targetProto: Widget, property: string | symbol): void;
export function property(check: TypeGuard): CustomPropertyDecorator;
export function property(...args: any[]): PropertyDecorator | void {
  return applyDecorator('property', args, (widgetProto: any, propertyName: string) => {
    const changeEvent = propertyName + 'Changed';
    const targetType = getPropertyType(widgetProto, propertyName);
    const check = args[0] instanceof Function ? args[0] : null;
    if (targetType === Object && !check) {
      markAsUnchecked(widgetProto, propertyName);
    }
    Object.defineProperty(widgetProto, propertyName, {
      get(this: WidgetInterface) {
        return getPropertyStore(this).get(propertyName);
      },
      set(this: WidgetInterface, value: any) {
        let currentValue = getPropertyStore(this).get(propertyName);
        if (currentValue !== value) {
          setterTypeCheck(propertyName, value, targetType, check);
          getPropertyStore(this).set(propertyName, value);
          this.trigger(changeEvent, new ChangeEvent(this, changeEvent, value));
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
