import 'reflect-metadata';
import {Composite} from 'tabris';
import {Widget} from 'tabris';
import {checkType} from '../api/checkType';
import {applyDecorator, defineGetter, getPropertyType} from '../internals//utils';
import {checkAppended, checkIsComponent, getPropertyStore, postAppendHandlers, TypeGuard, WidgetInterface} from '../internals//utils-databinding';

/**
 * A decorator for instance properties of classes extending `Composite`,
 * otherwise known as a "custom component".
 *
 * Makes the decorated property return a component-internal child element
 * whose id is identical to the property name. This provides an alternative to
 * the `_find` function. Example:
 *
 * ```ts
 * ‍@getById readonly button1: Button;
 * ```
 * *
 * *Notes:*
 * * *The property will be read-only.*
 * * *If there is no child with the correct id, or more than one, an error will be thrown.*
 * * *In TypeScript the type of the widget will also be checked.*
 * * *Use `@getById(typeGuard)` to implement an explicit type check instead. This is
 *   especially useful in JavaScript where the is no implicit type check.*
 */
export function getById(targetProto: Composite, property: string): void;

/**
 * A decorator for instance properties of classes extending `Composite`,
 * otherwise known as a "custom component".
 *
 * Makes the decorated property return a component-internal child element
 * whose id is identical to the property name and passes the type guard check.
 * This is especially useful in JavaScript where the is no implicit type check.
 * JavaScript example:
 *
 * ```ts
 * /⋆⋆ @type {Button} ⋆/
 * ‍@getById(widget => widget instanceof Button)
 * readonly buttonId;
 * ```
 *
 * *Notes:*
 * * *The property will be read-only.*
 * * *If there is no child with the correct id, or more than one, an error will be thrown.*
 * * *In TypeScript this feature may be used to override the explicit type check.
 * * *Use `@getById` if no type check is needed/desired.
 */
export function getById(check: TypeGuard): PropertyDecorator;

export function getById(...args: any[]): void | PropertyDecorator {
  return applyDecorator('getById', args, (widgetProto: any, property: string) => {
    const check = args[0] instanceof Function ? args[0] : null;
    const type = getPropertyType(widgetProto, property);
    if (type !== Object
      && !(type.prototype instanceof Widget)
      && type.prototype !== Widget.prototype
    ) {
      throw new Error(`Type "${type.name}" is not a widget.`);
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
