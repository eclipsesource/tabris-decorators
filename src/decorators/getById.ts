import 'reflect-metadata';
import { Composite } from 'tabris';
import { Widget } from 'tabris';
import { checkType } from '../api/checkType';
import { applyDecorator, checkAppended, checkIsComponent, defineGetter, getPropertyStore, getPropertyType, postAppendHandlers, TypeGuard, WidgetInterface } from '../internals//utils';

export function getById(targetProto: Composite, property: string): void;
export function getById(check: TypeGuard): PropertyDecorator;
export function getById(...args: any[]): void | PropertyDecorator{
  return applyDecorator('getById', args, (widgetProto: any, property: string) => {
    const check = args[0] instanceof Function ? args[0] : null;
    let type = getPropertyType(widgetProto, property);
    if (type === Object && !check) {
      throw new Error(`Property ${property} can not be resolved without a type guard.`);
    }
    postAppendHandlers(widgetProto).push((widget) => {
      try {
        getPropertyStore(widget).set(property, getByIdImpl(widget, property, check));
      } catch (ex) {
        throwPropertyResolveError('getById', property, ex.message);
      }
    });
    defineGetter(widgetProto, property, function(this: WidgetInterface) {
      try {
        checkIsComponent(this);
        checkAppended(this);
      } catch (ex) {
        throwPropertyResolveError('getById', property, ex.message);
      }
      return getPropertyStore(this).get(property);
    });
    setTimeout(() => {
      try {
        checkIsComponent(widgetProto);
      } catch (ex) {
        // tslint:disable-next-line:no-console
        console.error(getErrorMessage('getById', property, ex.message));
      }
    });
  });
}

function getByIdImpl(widgetInstance: WidgetInterface, property: string, typeGuard: TypeGuard): Widget {
  let results = widgetInstance._find('#' + property);
  if (results.length === 0) {
    throw new Error(`No widget with id "${property}" appended.`);
  }
  if (results.length > 1) {
    throw new Error(`More than one widget with id "${property}" appended.`);
  }
  if (typeGuard) {
    if (!typeGuard(results[0])) {
      throw new Error('Type guard rejected widget');
    }
  } else {
    checkType(results[0], getPropertyType(widgetInstance, property));
  }
  return results[0];
}

function throwPropertyResolveError(decorator: string, property: string, message: string): never {
  throw new Error(getErrorMessage(decorator, property, message));
}

function getErrorMessage(decorator: string, property: string, message: string): string {
  return `Decorator "${decorator}" could not resolve property "${property}": ${message}`;
}
