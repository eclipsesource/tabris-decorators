import 'reflect-metadata';
import { Widget } from 'tabris';
import { WidgetCollection } from 'tabris';
import { WidgetResizeEvent } from 'tabris';
import { typeGuards } from './TypeGuards';
import { BaseConstructor, Constructor, getPropertyType, wasAppended, WidgetInterface } from './utils';

export interface JsxBindings { [targetProperty: string]: string; }

export interface OneWayBinding {
  path: string;
  target: Widget;
  targetProperty: string;
  targetPropertyType: BaseConstructor<any>;
  sourceProperty: string;
  sourceChangeEvent: string;
}

export interface TwoWayBinding {
  path: string;
  baseProperty: string;
  selector: string;
  targetProperty: string;
  targetKey: symbol;
  targetChangeEvent: string;
  baseChangeEvent: string;
}

export function applyJsxBindings(targetInstance: Widget, bindings: JsxBindings) {
  let oneWayBindings: OneWayBinding[] = [];
  for (let targetProperty in bindings) {
    try {
      oneWayBindings.push(
        createOneWayBindingDesc(targetInstance, targetProperty, bindings[targetProperty])
      );
    } catch (ex) {
      throw new Error(`Could not bind property "${targetProperty}" to "${bindings[targetProperty]}": ${ex.message}`);
    }
  }
  targetInstance[oneWayBindingsKey] = oneWayBindings;
  targetInstance.once({resize: checkBindingsApplied});
}

export function getOneWayBindings(instance: Widget): OneWayBinding[] {
  return instance[oneWayBindingsKey];
}

export function clearOneWayBindings(instance: Widget) {
  delete instance[oneWayBindingsKey];
}

export function checkAccess(base: WidgetInterface, binding: TwoWayBinding) {
  if (!wasAppended(base)) {
    throw new Error(`Can not access property "${binding.baseProperty}": `
    + `Binding "${binding.path}" is not ready because no widgets have been appended yet.`);
  }
}

export function checkBindingType(bindingPath: string, value: any, targetType: BaseConstructor<any>) {
  try {
    typeGuards.checkType(value, targetType);
  } catch (ex) {
    throw new Error(`Binding "${bindingPath}" failed: ${ex.message}`);
  }
}

export function getChild(base: WidgetInterface, selector: string) {
  let results = (base as any)._find(selector) as WidgetCollection<Widget>;
  if (results.length === 0) {
    throw new Error(`No widget matching "${selector}" was appended.`);
  } else if (results.length > 1) {
    throw new Error(`Multiple widgets matching "${selector}" were appended.`);
  }
  return results.first() as WidgetInterface;
}

export function createTwoWayBindingDesc(path: string, baseProperty: string): TwoWayBinding {
  checkPathSyntax(path);
  if (!path.startsWith('#')) {
    throw new Error('Binding path needs to start with "#".');
  }
  let segments = path.split('.');
  if (segments.length < 2) {
    throw new Error('Binding path needs at least two segments.');
  } else if (segments.length > 2) {
    throw new Error('Binding path has too many segments.');
  }
  let [selector, targetProperty] = segments;
  return {
    path,
    selector,
    targetProperty,
    baseProperty,
    targetKey: Symbol(baseProperty + 'Target'),
    targetChangeEvent: targetProperty + 'Changed',
    baseChangeEvent: baseProperty + 'Changed'
  };
}

function createOneWayBindingDesc(target: Widget, targetProperty: string, path: string): OneWayBinding {
  checkPathSyntax(path);
  if (path.startsWith('.') || path.startsWith('#')) {
    throw new Error('JSX binding path can currently not contain a selector.');
  }
  if (path.split('.').length > 1) {
    throw new Error('JSX binding path can currently only have one segment.');
  }
  let sourceProperty = path; // TODO: support other sources than base
  let sourceChangeEvent = sourceProperty + 'Changed';
  let targetPropertyType = getPropertyType(target, targetProperty);
  checkPropertyExists(target, targetProperty);
  checkBindableType(targetProperty, targetPropertyType);
  return {
    target, targetProperty, path, sourceProperty, sourceChangeEvent, targetPropertyType
  };
}

export function checkBindableType(property: string, type: Constructor<any>) {
  if (type === Object) {
    throw new Error(`Type of "${property}" could not be inferred. `
      + 'Only classes and primitive types are supported.');
  }
}

export function checkPropertyExists(targetWidget: any, targetProperty: string, targetName: string = 'Target') {
  if (!(targetProperty in targetWidget)) {
    throw new Error(`${targetName} does not have a property "${targetProperty}".`);
  }
}

function checkBindingsApplied(ev: WidgetResizeEvent) {
  if (getOneWayBindings(ev.target)) {
    throw new Error('Could not resolve one-way binding on CustomComponent: Not appanded to a @component');
  }
}

function checkPathSyntax(targetPath: string) {
  if (/\s|\[|\]|\(|\)|\<|\>/.test(targetPath)) {
    throw new Error('Binding path contains invalid characters.');
  }
  if (/this/.test(targetPath)) {
    throw new Error('Binding path contains reserved word "this".');
  }
}

const oneWayBindingsKey = Symbol();
