import { JsxProcessor, NativeObject, Widget } from 'tabris';
import { applyJsxBindings, JsxBindings } from './applyJsxBindings';
import { Injector } from '../api/Injector';
import { Constructor, hasInjections } from '../internals/utils';
/* tslint:disable no-namespace ban-types only-arrow-functions */

export interface Properties { [property: string]: any; }
export type JsxConstructor = {prototype: JSX.ElementClass, new(): object};
export type JsxNativeType = {prototype: JSX.ElementClass, new(): NativeObject};

export type JsxTemplate = {source: unknown} | {
  jsx: ExtendedJSX,
  componentType: JsxConstructor,
  sfc: ((param: object) => any),
  attributes: object,
  children: JsxTemplate[]
};

export function getJsxTemplate(source: any): JsxTemplate {
  if (source instanceof Object && source[jsxTemplateKey]) {
    return source[jsxTemplateKey];
  }
  return {source};
}

export class ExtendedJSX extends JsxProcessor {

  public strictMode: boolean = false;

  constructor(private readonly injector: Injector) {
    super();
  }

  public createCustomComponent(type: JsxConstructor, attributes: any): JSX.ElementClass | string {
    const result = super.createCustomComponent(type, attributes);
    if (result instanceof Object) {
      const {children, ...pureAttributes} = attributes;
      result[jsxTemplateKey] = {
        jsx: this,
        componentType: type,
        sfc: null,
        attributes: pureAttributes,
        children: children ? children.map(getJsxTemplate) : null
      } as JsxTemplate;
    }
    return result;
  }

  public createFunctionalComponent(type: ((param: object) => any), attributes: any): JSX.ElementClass | string {
    const result = super.createFunctionalComponent(type, attributes);
    if (result instanceof Object) {
      const {children, ...pureAttributes} = attributes;
      result[jsxTemplateKey] = {
        jsx: this,
        componentType: null,
        sfc: type,
        attributes: pureAttributes,
        children: (children || []).map(getJsxTemplate)
      } as JsxTemplate;
    }
    return result;
  }

  public createNativeObject(Type: JsxNativeType, attributes: Properties) {
    let {miscAttributes, bindings} = this.extractBindings(attributes);
    let result = super.createNativeObject(
      this.convertType(Type),
      miscAttributes || {}
    );
    if (bindings && result instanceof Widget) {
      applyJsxBindings(result, bindings, this.strictMode);
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

const jsxTemplateKey = Symbol('jsxTemplate');
