import {JsxProcessor, NativeObject, Widget} from 'tabris';
import {applyJsxBindings, JsxBindings} from './applyJsxBindings';
import {Injector} from '../api/Injector';
import {Constructor, hasInjections} from '../internals/utils';

export interface Properties { [property: string]: any; }
export type JsxConstructor = {prototype: JSX.ElementClass, new(): object};
export type JsxNativeType = {prototype: JSX.ElementClass, new(): NativeObject};

export type JsxInfo = {source: unknown} | {
  processor: ExtendedJSX,
  componentType: JsxConstructor,
  sfc: ((param: object) => any),
  attributes: object,
  children: JsxInfo[]
};

export function getJsxInfo(source: any): JsxInfo {
  if (source instanceof Object && source[jsxInfo]) {
    return source[jsxInfo];
  }
  return {source};
}

export type Severity = 'warn' | 'error';

export class ExtendedJSX extends JsxProcessor {

  unsafeBindings: Severity = 'warn';

  constructor(private readonly injector: Injector) {
    super();
  }

  createCustomComponent(type: JsxConstructor, attributes: any): JSX.ElementClass | string {
    const result = super.createCustomComponent(type, attributes);
    if (result instanceof Object) {
      const {children, ...pureAttributes} = attributes;
      result[jsxInfo] = {
        processor: this,
        componentType: type,
        sfc: null,
        attributes: pureAttributes,
        children: children ? children.map(getJsxInfo) : null
      } as JsxInfo;
    }
    return result;
  }

  createFunctionalComponent(type: ((param: object) => any), attributes: any): JSX.ElementClass | string {
    const result = super.createFunctionalComponent(type, attributes);
    if (result instanceof Object) {
      const {children, ...pureAttributes} = attributes;
      result[jsxInfo] = {
        processor: this,
        componentType: null,
        sfc: type,
        attributes: pureAttributes,
        children: (children || []).map(getJsxInfo)
      } as JsxInfo;
    }
    return result;
  }

  createNativeObject(Type: JsxNativeType, attributes: Properties) {
    const {miscAttributes, bindings} = this.extractBindings(attributes);
    const result = super.createNativeObject(
      this.convertType(Type),
      miscAttributes || {}
    );
    if (bindings && result instanceof Widget) {
      applyJsxBindings(result, bindings, this.unsafeBindings);
    }
    return result;
  }

  private extractBindings(attributes: Properties) {
    let miscAttributes: Properties | void;
    let bindings: JsxBindings | void;
    for (const attribute in attributes) {
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

  private convertType(type: JsxNativeType): any {
    const injector = this.injector;
    if (hasInjections(type)) {
      return function(props: any) {
        return injector.create(type as Constructor<any>, props);
      };
    }
    return type;
  }

}

const jsxInfo = Symbol('jsxInfo');
