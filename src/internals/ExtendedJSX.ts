import { JsxProcessor, NativeObject, Widget } from 'tabris';
import { applyJsxBindings, JsxBindings } from './applyJsxBindings';
import { Injector } from '../api/Injector';
import { Constructor, hasInjections } from '../internals/utils';
/* tslint:disable no-namespace ban-types only-arrow-functions */

export interface Properties { [property: string]: any; }
export type NativeType = Constructor<NativeObject> | ((props: Properties) => NativeObject);

export class ExtendedJSX extends JsxProcessor {

  constructor(private readonly injector: Injector) {
    super();
  }

  public createNativeObject(Type: Constructor<NativeObject>, attributes: Properties) {
    let {miscAttributes, bindings} = this.extractBindings(attributes);
    let result = super.createNativeObject(
      this.convertType(Type),
      miscAttributes || {}
    );
    if (bindings && result instanceof Widget) {
      applyJsxBindings(result, bindings);
    }
    return result;
  }

  private extractBindings(attributes: Properties) {
    let miscAttributes: Properties | void;
    let bindings: JsxBindings | void;
    for (let attribute in attributes) {
      if (attribute.startsWith('bind-') || attribute.startsWith('template-')) {
        if (!bindings) {
          bindings = {};
        }
        bindings[attribute] = attributes[attribute];
      } else {
        if (!miscAttributes) {
          miscAttributes = {};
        }
        miscAttributes[attribute] = attributes[attribute];
      }
    }
    return {miscAttributes, bindings};
  }

  private convertType(type: Constructor<NativeObject>): NativeType {
    const injector = this.injector;
    if (hasInjections(type)) {
      return function(props: any) {
        return injector.create(type as Constructor<any>, props);
      };
    }
    return type;
  }

}
