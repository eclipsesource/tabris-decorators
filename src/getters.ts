import 'reflect-metadata';
import {Composite} from 'tabris';
import {
  defineGetter,
  getPropertyType,
  applyDecorator,
  WidgetInterface,
  postAppendHandlers,
  wasAppended,
  getPropertyStore,
  WidgetResolver
} from './utils';

export function getById(targetProto: Composite, property: string): void;
export function getById(...args: any[]): void {
  defineWidgetGetter('getById', args, getByIdImpl);
}

export function getByType(targetProto: Composite, property: string): void;
export function getByType(...args: any[]): void {
  defineWidgetGetter('getByType', args, getByTypeImpl);
}

/* Internals */

function defineWidgetGetter(name: string, args: any[], resolver: WidgetResolver): void {
  applyDecorator(name, args, (widgetProto: any, property: string) => {
    let type = getPropertyType(widgetProto, property);
    if (!type) {
      throw new Error('Type could not be inferred.');
    }
    postAppendHandlers(widgetProto).push((widget) => {
      try {
        getPropertyStore(widget).set(property, resolver(widget, property, type));
      } catch (ex) {
        throwPropertyResolveError(name, property, ex.message);
      }
    });
    defineGetter(widgetProto, property, function(this: WidgetInterface) {
      if (!wasAppended(this)) {
        throwPropertyResolveError(name, property, 'No widgets have been appended yet.');
      }
      return getPropertyStore(this).get (property);
    });
  });
}

function getByIdImpl(widgetInstance: WidgetInterface, property: string): WidgetInterface {
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

function getByTypeImpl(widgetInstance: WidgetInterface, property: string): WidgetInterface {
  let results = widgetInstance.find(getPropertyType(widgetInstance, property));
  if (results.length === 0) {
    throw new Error('No widget of expected type appended.');
  }
  if (results.length > 1) {
    throw new Error('More than one widget of expected type appended.');
  }
  return results[0];
}

function throwPropertyResolveError(decorator: string, property: string, message: string): never {
  throw new Error(`Decorator "${decorator}" could not resolve property "${property}": ${message}`);
}
