import 'reflect-metadata';
import {Widget} from 'tabris';
import {WidgetCollection} from 'tabris';
import {
  DecoratorFactory,
  defineGetter,
  getPropertyType,
  areStaticDecoratorArgs,
  applyPropertyDecorator,
  WidgetInterface,
  WidgetConstructor
} from './utils';

type Finder = (widget: WidgetInterface, string: Selector, type: WidgetConstructor) => any;
type TypeParser = (widgetProto: WidgetInterface, property: string, finderArgs: any[]) => WidgetConstructor;

export function findFirst(targetProto: Widget, property: string): void;
export function findFirst(targetType?: WidgetConstructor, selector?: string): DecoratorFactory;
export function findFirst(selector: string): DecoratorFactory;

export function findFirst(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findFirst', args, getWidgetType, (widget, selector, type) => {
    return widget.find(selector).first(type) || null;
  });
}

export function findLast(targetProto: Widget, property: string): void;
export function findLast(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findLast(selector: string): DecoratorFactory;

export function findLast(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findLast', args, getWidgetType, (widget, selector, type) => {
    return widget.find(selector).last(type) || null;
  });
}

export function findAll(targetType: WidgetConstructor, selector?: string): DecoratorFactory;

export function findAll(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findAll', args, getWidgetCollectionType, (widget, selector, type) => {
    return widget.find(selector).filter(type) || null;
  });
}

function defineWidgetFinder(name: string, args: any[], widgetTypeParser: TypeParser, finder: Finder) {
  return applyPropertyDecorator(name, args, (widgetProto: WidgetInterface, property: string) => {
    const selector = getSelector(args);
    const type = widgetTypeParser(widgetProto, property, args);
    defineGetter(widgetProto, property, function(this: Widget) {
      return finder(this, selector, type);
    });
  });
}

function getSelector(args: any[]): string {
  return areStaticDecoratorArgs(args) ? '*' : args[args.length - 1];
}

function getWidgetType(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  let type = finderArgs[0] instanceof Function ? finderArgs[0] : null;
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
