import 'reflect-metadata';
import { Composite } from 'tabris';
import { Widget } from 'tabris';
import { applyDecorator, checkIsComponent, checkType, defineGetter, getPropertyStore, getPropertyType, postAppendHandlers, wasAppended, WidgetInterface } from './utils';

export function getById(targetProto: Composite, property: string): void;
export function getById(...args: any[]): void {
  applyDecorator('getById', args, (widgetProto: any, property: string) => {
    let type = getPropertyType(widgetProto, property);
    if (type === Object) {
      throw new Error('Property type could not be inferred.');
    }
    postAppendHandlers(widgetProto).push((widget) => {
      try {
        checkIsComponent(widgetProto);
        getPropertyStore(widget).set(property, getByIdImpl(widget, property));
      } catch (ex) {
        throwPropertyResolveError('getById', property, ex.message);
      }
    });
    defineGetter(widgetProto, property, function(this: WidgetInterface) {
      if (!wasAppended(this)) {
        throwPropertyResolveError('getById', property, 'No widgets have been appended yet.');
      }
      return getPropertyStore(this).get(property);
    });
  });
}

function getByIdImpl(widgetInstance: WidgetInterface, property: string): Widget {
  let results = widgetInstance._find('#' + property);
  if (results.length === 0) {
    throw new Error(`No widget with id "${property}" appended.`);
  }
  if (results.length > 1) {
    throw new Error(`More than one widget with id "${property}" appended.`);
  }
  checkType(results[0], getPropertyType(widgetInstance, property));
  return results[0];
}

function throwPropertyResolveError(decorator: string, property: string, message: string): never {
  throw new Error(`Decorator "${decorator}" could not resolve property "${property}": ${message}`);
}
