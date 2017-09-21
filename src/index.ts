import 'reflect-metadata';
import {Widget} from 'tabris';

export interface WidgetConstructor { new (...args: any[]): Widget; }
export type WidgetInterface = {[prop: string]: any} & Widget;
export type DecoratorFactory = (widgetProto: WidgetInterface, property: string) => void;

export function findFirst(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findFirst(selector: string): DecoratorFactory;

export function findFirst(...args: any[]): DecoratorFactory {
  let selector = getSelector(args);
  return (widgetProto: WidgetInterface, property: string) => {
    try {
      const type = getType(widgetProto, property, args);
      defineGetter(widgetProto, property, function(this: Widget) {
        return this.find(type).first(selector) || null;
      });
    } catch (error) {
      throw new Error(`Could not apply decorator "findFirst" to property "${property}": ${error.message}`);
    }
  };
}

function defineGetter(widgetProto: WidgetInterface, property: string, get: () => any): void {
  if (Object.getOwnPropertyDescriptor(widgetProto, property)) {
    throw new Error('A getter or setter was already defined.');
  }
  Object.defineProperty(widgetProto, property, {
    get,
    enumerable: true,
    configurable: true
  });
}

function getSelector(finderArgs: any[]): string {
  return finderArgs[finderArgs.length - 1] as string;
}

function getType(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  let type = finderArgs.length === 2 ? finderArgs[0] : null;
  if (type === null) {
    type = Reflect.getMetadata('design:type', widgetProto, property);
    if (type === Object) {
      throw new Error('Return type was not given and could not be inferred.');
    }
  }
  return type;
}
