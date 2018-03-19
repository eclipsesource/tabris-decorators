/* tslint:disable no-namespace ban-types only-arrow-functions */
import 'tabris';
import { applyJsxBindings, JsxBindings } from './data-binding';
import { Constructor } from './utils';
import { injector } from './Injector';

const originalJSX = JSX;

interface Properties { [property: string]: any; }

(global as any).JSX = {

  createElement(
    type: string|Constructor<any>, jsxProperties: Properties, ...children: tabris.Widget[]
  ) {
    let {properties, bindings} = extractBindings(jsxProperties);
    let result = originalJSX.createElement(convertType(type), properties as Object, ...children);
    if (bindings) {
      applyJsxBindings(result, bindings);
    }
    return result;
  }

};

function extractBindings(attributes: Properties) {
  let properties: Properties | void;
  let bindings: JsxBindings | void;
  for (let attribute in attributes) {
    if (attribute.startsWith('bind-')) {
      if (!bindings) {
        bindings = {};
      }
      bindings[attribute.slice(5)] = attributes[attribute];
    } else {
      if (!properties) {
        properties = {};
      }
      properties[attribute] = attributes[attribute];
    }
  }
  return {properties, bindings};
}

function convertType(type: string | Constructor<any>): string | Function {
  if (type instanceof Function) {
    return function(...args: any[]) {
      return injector.create(type, args);
    };
  }
  return type;
}
