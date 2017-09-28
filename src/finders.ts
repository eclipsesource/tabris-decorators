import 'reflect-metadata';
import {Widget, WidgetCollection} from 'tabris';
import {
  DecoratorFactory,
  defineGetter,
  getPropertyType,
  areStaticDecoratorArgs,
  applyPropertyDecorator,
  WidgetInterface,
  WidgetConstructor,
  WidgetResolver
} from './utils';

type TypeParser = (widgetProto: WidgetInterface, property: string, finderArgs: any[]) => WidgetConstructor;

export function findFirst(targetProto: Widget, property: string): void;
export function findFirst(targetType?: WidgetConstructor, selector?: string): DecoratorFactory;
export function findFirst(selector: string): DecoratorFactory;
export function findFirst(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findFirst', args, getReturnTypeWidget, findFirstImpl);
}

export function findLast(targetProto: Widget, property: string): void;
export function findLast(targetType: WidgetConstructor, selector: string): DecoratorFactory;
export function findLast(selector: string): DecoratorFactory;
export function findLast(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findLast', args, getReturnTypeWidget, findLastImpl);
}

export function findAll(targetType: WidgetConstructor, selector?: string): DecoratorFactory;
export function findAll(...args: any[]): DecoratorFactory | void {
  return defineWidgetFinder('findAll', args, getReturnTypeCollection, findAllImpl);
}

/* Internals */

function defineWidgetFinder(name: string, args: any[], widgetTypeParser: TypeParser, finder: WidgetResolver) {
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

function getReturnTypeWidget(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  let type = finderArgs[0] instanceof Function ? finderArgs[0] : null;
  if (type === null) {
    type = getPropertyType(widgetProto, property);
  }
  if (type === null) {
    throw new Error('Return type was not given and could not be inferred.');
  }
  return type;
}

function getReturnTypeCollection(widgetProto: WidgetInterface, property: string, finderArgs: any[]): WidgetConstructor {
  if (getPropertyType(widgetProto, property) !== WidgetCollection) {
    throw new Error('Return type has to be WidgetCollection<WidgetType>.');
  }
  return finderArgs[0];
}

function findFirstImpl(widget: WidgetInterface, selector: string, type: WidgetConstructor) {
    return widget.find(selector).first(type) || null;
}

function findLastImpl(widget: WidgetInterface, selector: string, type: WidgetConstructor) {
  return widget.find(selector).last(type) || null;
}

function findAllImpl(widget: WidgetInterface, selector: string, type: WidgetConstructor) {
  return widget.find(selector).filter(type) || null;
}
