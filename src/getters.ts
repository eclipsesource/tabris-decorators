import 'reflect-metadata';
import {defineGetter, getPropertyType, applyPropertyDecorator, WidgetInterface} from './utils';
import {Widget, Composite} from 'tabris';

const cacheKey = Symbol();
const propertyListKey = Symbol();
const originalAppendKey = Symbol();
const gettersResolvedKey = Symbol();

export function getById(targetProto: Composite, property: string): void;

export function getById(...args: any[]): void {
  applyPropertyDecorator('getById', args, (widgetProto: any, property: string) => {
    checkType(widgetProto, property);
    patchAppend(widgetProto);
    getPropertyList(widgetProto).push(property);
    defineGetter(widgetProto, property, function(this: WidgetInterface) {
      if (!this[gettersResolvedKey]) {
        throw createGetByIdError(property, 'No widgets have been appended yet.');
      }
      return getCache(this).get(property);
    });
  });
}

function checkType(widgetProto: WidgetInterface, property: string): void {
  if (!getPropertyType(widgetProto, property)) {
    throw new Error('Type could not be inferred.');
  }
}

function patchAppend(widgetProto: WidgetInterface) {
  if (widgetProto.append !== customAppend) {
    widgetProto[originalAppendKey] = widgetProto.append;
    widgetProto.append = customAppend;
  }
}

function customAppend(this: WidgetInterface): any {
  let result = this[originalAppendKey].apply(this, arguments);
  resolveGetters(this);
  return result;
}

function resolveGetters(widgetInstance: WidgetInterface) {
  if (widgetInstance[gettersResolvedKey]) {
    return;
  }
  let cache = getCache(widgetInstance);
  let getters = getPropertyList(widgetInstance);
  for (let property of getters) {
    try {
      cache.set(property, findWidget(widgetInstance, property));
    } catch (ex) {
      throw createGetByIdError(property, ex.message);
    }
  }
  widgetInstance[gettersResolvedKey] = true;
}

function getCache(widgetInstance: WidgetInterface): Map<string, WidgetInterface> {
  if (!widgetInstance[cacheKey]) {
    widgetInstance[cacheKey] = new Map<string, WidgetInterface>();
  }
  return widgetInstance[cacheKey];
}

function getPropertyList(widgetProto: WidgetInterface): string[] {
  if (!widgetProto[propertyListKey]) {
    widgetProto[propertyListKey] = [];
  }
  return widgetProto[propertyListKey];
}

function findWidget(widgetInstance: WidgetInterface, property: string): WidgetInterface {
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

function createGetByIdError(property: string, message: string) {
  return new Error(`Decorator "getById" could not resolve property "${property}": ${message}`);
}
