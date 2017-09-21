import 'reflect-metadata';
import {Widget} from 'tabris';

type Target = {[prop: string]: any} & Widget;

export function findFirst(selector: string) {
  return (widgetProto: Target, property: string) => {
    Object.defineProperty(widgetProto, property, {
      get(this: Widget) {
        let type = Reflect.getMetadata('design:type', widgetProto, property);
        return this.find(type).first(selector) || null;
      },
      enumerable: true,
      configurable: true
    });
  };
}
