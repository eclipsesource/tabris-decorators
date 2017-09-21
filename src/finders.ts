import 'reflect-metadata';
import {Widget} from 'tabris';
import {WidgetCollection} from 'tabris';

export interface WidgetConstructor { new (...args: any[]): Widget; }
export type WidgetInterface = {[prop: string]: any} & Widget;
export type DecoratorFactory = (widgetProto: WidgetInterface, property: string) => void;
type Finder = (widget: WidgetInterface, string: Selector, type: WidgetConstructor) => any;
type TypeParser = (widgetProto: WidgetInterface, property: string, finderArgs: any[]) => WidgetConstructor;

export function findFirst(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findFirst(selector: string): DecoratorFactory;
export function findFirst(...args: any[]): DecoratorFactory {
  return defineFinder('findFirst', args, getWidgetType, (widget, selector, type) => {
    return widget.find(selector).first(type) || null;
  });
}

export function findLast(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findLast(selector: string): DecoratorFactory;
export function findLast(...args: any[]): DecoratorFactory {
  return defineFinder('findLast', args, getWidgetType, (widget, selector, type) => {
    return widget.find(selector).last(type) || null;
  });
}

export function findAll(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findAll(...args: any[]): DecoratorFactory {
  return defineFinder('findAll', args, getWidgetCollectionType, (widget, selector, type) => {
    return widget.find(selector).filter(type) || null;
  });
}

function defineFinder(name: string, args: any[], widgetTypeParser: TypeParser, finder: Finder): DecoratorFactory {
  let selector = getSelector(args);
  return (widgetProto: WidgetInterface, property: string) => {
    try {
      const type = widgetTypeParser(widgetProto, property, args);
      defineGetter(widgetProto, property, function(this: Widget) {
        return finder(this, selector, type);
      });
    } catch (error) {
      throw new Error(`Could not apply decorator "${name}" to property "${property}": ${error.message}`);
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

function getWidgetType(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  let type = finderArgs.length === 2 ? finderArgs[0] : null;
  if (type === null) {
    type = getPropertyType(widgetProto, property);
  }
  if (type === null) {
    throw new Error('Return type was not given and could not be inferred.');
  }
  return type;
}

function getWidgetCollectionType(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  let type = finderArgs[0];
  if (getPropertyType(widgetProto, property) !== WidgetCollection) {
    throw new Error('Return type has to be WidgetCollection or WidgetCollection<WidgetType>.');
  }
  return finderArgs[0];
}

function getPropertyType(widgetProto: WidgetInterface, property: string): any {
  let result = Reflect.getMetadata('design:type', widgetProto, property);
  return result === Object ? null : result;
}
