import { Widget } from 'tabris';
import { applyJsxBindings, JsxBindings } from './bind-one-way';
import { Injector } from '../api/Injector';
import { Constructor, hasInjections } from '../internals/utils';
/* tslint:disable no-namespace ban-types only-arrow-functions */

export interface Properties { [property: string]: any; }

const originalJSX = JSX;

export class ExtendedJSX {

  constructor(private readonly injector: Injector) { }

  public createElement = (
    type: string|Constructor<any>, jsxProperties: Properties, ...children: Widget[]
  ) => {
    let {properties, bindings} = this.extractBindings(jsxProperties);
    let result = originalJSX.createElement(this.convertType(type), properties as Object, ...children);
    if (bindings) {
      applyJsxBindings(result, bindings);
    }
    return result;
  }

  private extractBindings(attributes: Properties) {
    let properties: Properties | void;
    let bindings: JsxBindings | void;
    for (let attribute in attributes) {
      if (attribute.startsWith('bind-') || attribute.startsWith('template-')) {
        if (!bindings) {
          bindings = {};
        }
        bindings[attribute] = attributes[attribute];
      } else {
        if (!properties) {
          properties = {};
        }
        properties[attribute] = attributes[attribute];
      }
    }
    return {properties, bindings};
  }

  private convertType(type: string | Constructor<any>): string | Function {
    let injector = this.injector;
    if (type instanceof Function && hasInjections(type)) {
      return function(props: any) {
        return injector.create(type, props);
      };
    }
    return type;
  }

}
