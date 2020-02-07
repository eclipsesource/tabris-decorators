import 'reflect-metadata';
import {Composite} from 'tabris';
import {Widget} from 'tabris';
import {checkType} from '../api/checkType';
import {applyDecorator, defineGetter, getPropertyType} from '../internals//utils';
import {checkAppended, checkIsComponent, getPropertyStore, postAppendHandlers, TypeGuard, WidgetInterface} from '../internals//utils-databinding';

/**
 * A decorator for readonly properties on classes extending `Widget`.
 *
 * Lets the property return the descendant widget with the same id as the property name.
 * There must be exactly one match. The lookup happens on the first `append` call on the
 * decorated class.
 *
 * The decorator can optionally also attach a type guard function to the property.
 * This is necessary if the exact type of the widget is not known:
 * ```
 * ‍@getById(widget => typeof widget.text === 'string')
 * readonly widgetId: Widget & {text: string};
 * ```
 *
 * This decorator only works on classes decorated with `@component`.
 */
export function getById(targetProto: Composite, property: string): void;
/**
 * A decorator for readonly properties on classes extending `Widget`.
 *
 * Lets the property return the descendant widget with the same id as the property name.
 * There must be exactly one match. The lookup happens on the first `append` call on the
 * decorated class.
 *
 * The decorator can optionally also attach a type guard function to the property.
 * This is necessary if the exact type of the widget is not known:
 * ```
 * ‍@getById(widget => typeof widget.text === 'string')
 * readonly widgetId: Widget & {text: string};
 * ```
 *
 * This decorator only works on classes decorated with `@component`.
 */
export function getById(check: TypeGuard): PropertyDecorator;
export function getById(...args: any[]): void | PropertyDecorator {
  return applyDecorator('getById', args, (widgetProto: any, property: string) => {
    const check = args[0] instanceof Function ? args[0] : null;
    const type = getPropertyType(widgetProto, property);
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
    // class decorators are applied after property decorators, therefore a timeout is needed
    setTimeout(() => {
      try {
        checkIsComponent(widgetProto);
      } catch (ex) {
        console.error(getErrorMessage('getById', property, ex.message));
      }
    });
  });
}

function getByIdImpl(widgetInstance: WidgetInterface, property: string, typeGuard: TypeGuard): Widget {
  const results = widgetInstance._find('#' + property);
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
