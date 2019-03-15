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
    type: Function|string, jsxProperties: Properties, ...children: Widget[]
  ) => {
    let {properties, bindings} = this.extractBindings(jsxProperties);
    // TODO: Fix createElement signature in tabris module
    let result = originalJSX.createElement(
      this.convertType(type) as Function,
      properties as Object,
      ...children as any
    );
    if (bindings) {
      // TODO: Check result to actually be a widget
      applyJsxBindings(result as unknown as Widget, bindings);
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

  private convertType(type: string | Function): string | Function {
    let injector = this.injector;
    if (type instanceof Function && hasInjections(type)) {
      return function(props: any) {
        return injector.create(type as Constructor<any>, props);
      };
    }
    return type;
  }

}
