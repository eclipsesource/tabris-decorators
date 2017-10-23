import {Widget} from 'tabris';
import {applyDecorator, WidgetInterface, getPropertyStore, ChangeEvent} from './utils';

export default function property(targetProto: Widget, property: string): void;
export default function property(...args: any[]): void {
  applyDecorator('property', args, (widgetProto: any, propertyName: string) => {
    const changeEvent = propertyName + 'Changed';
    Object.defineProperty(widgetProto, propertyName, {
      get(this: WidgetInterface) {
        return getPropertyStore(this).get(propertyName);
      },
      set(this: WidgetInterface, value: any) {
        let currentValue = getPropertyStore(this).get(propertyName);
        if (currentValue !== value) {
          getPropertyStore(this).set(propertyName, value);
          this.trigger(changeEvent, new ChangeEvent(this, changeEvent, value));
        }
      },
      enumerable: true,
      configurable: true
    });
  });
}
