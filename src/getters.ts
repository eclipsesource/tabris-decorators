import 'reflect-metadata';
import {
  defineGetter,
  getPropertyType,
  applyPropertyDecorator,
  WidgetInterface,
  initializers,
  isInitialized,
  getPropertyStore,
  Initializer
} from './utils';
import {Widget, Composite} from 'tabris';

type GetResolver = (widget: WidgetInterface, propertyName: string) => any;

export function getById(targetProto: Composite, property: string): void;

export function getById(...args: any[]): void {
  defineWidgetGetter('getById', args, findWidgetById);
}

export function getByType(targetProto: Composite, property: string): void;

export function getByType(...args: any[]): void {
  defineWidgetGetter('getByType', args, findWidgetByType);
}

export function defineWidgetGetter(name: string, args: any[], resolver: GetResolver): void {
  applyPropertyDecorator(name, args, (widgetProto: any, property: string) => {
    checkType(widgetProto, property);
    initializers(widgetProto).push((widget) => {
      try {
        getPropertyStore(widget).set(property, resolver(widget, property));
      } catch (ex) {
        throwPropertyResolveError(name, property, ex.message);
      }
    });
    defineStorageBackedGetter(widgetProto, property, name);
  });
}

function checkType(widgetProto: WidgetInterface, property: string): void {
  if (!getPropertyType(widgetProto, property)) {
    throw new Error('Type could not be inferred.');
  }
}

function findWidgetById(widgetInstance: WidgetInterface, property: string): WidgetInterface {
  let results = widgetInstance.find('#' + property);
  if (results.length === 0) {
    throw new Error(`No widget with id "${property}" appended.`);
  }
  if (results.length > 1) {
    throw new Error(`More than one widget with id "${property}" appended.`);
  }
  if (!(results[0] instanceof getPropertyType(widgetInstance, property))) {
    throw new Error(`Type mismatch.`);
  }
  return results[0];
}

function findWidgetByType(widgetInstance: WidgetInterface, property: string): WidgetInterface {
  let results = widgetInstance.find(getPropertyType(widgetInstance, property));
  if (results.length === 0) {
    throw new Error('No widget of expected type appended.');
  }
  if (results.length > 1) {
    throw new Error('More than one widget of expected type appended.');
  }
  return results[0];
}

function defineStorageBackedGetter(widgetProto: any, property: string, decorator: string) {
  defineGetter(widgetProto, property, function(this: WidgetInterface) {
    if (!isInitialized(this)) {
      throwPropertyResolveError(decorator, property, 'No widgets have been appended yet.');
    }
    return getPropertyStore(this).get (property);
  });
}

function throwPropertyResolveError(decorator: string, property: string, message: string): never {
  throw new Error(`Decorator "${decorator}" could not resolve property "${property}": ${message}`);
}
