import 'reflect-metadata';
import { Widget, WidgetResizeEvent } from 'tabris';
import { BaseConstructor, checkPathSyntax, checkPropertyExists, getPropertyType, isUnchecked, WidgetInterface } from './utils';

export interface JsxBindings { [targetProperty: string]: string; }

export function applyJsxBindings(targetInstance: Widget, bindings: JsxBindings) {
  let oneWayBindings: OneWayBinding[] = [];
  for (let targetProperty in bindings) {
    try {
      oneWayBindings.push(
        createOneWayBindingDesc(targetInstance as WidgetInterface, targetProperty, bindings[targetProperty])
      );
    } catch (ex) {
      throw new Error(`Could not bind property "${targetProperty}" to "${bindings[targetProperty]}": ${ex.message}`);
    }
  }
  targetInstance[oneWayBindingsKey] = oneWayBindings;
  targetInstance.once({resize: checkBindingsApplied});
}

export function processOneWayBindings(base: WidgetInterface, target: Widget) {
  let bindings = getOneWayBindings(target);
  if (bindings) {
    for (let binding of bindings) {
      initOneWayBinding(base, binding);
    }
    clearOneWayBindings(target);
  }
}

function initOneWayBinding(base: WidgetInterface, binding: OneWayBinding) {
  try {
    checkPropertyExists(base, binding.sourceProperty, base.constructor.name);
    base.on(binding.sourceChangeEvent, ({value}) => {
      try {
        binding.target[binding.targetProperty] = value;
      } catch (ex) {
        throwBindingFailedError(binding, ex);
      }
    });
    binding.target[binding.targetProperty] = base[binding.sourceProperty];
  } catch (ex) {
    throwBindingFailedError(binding, ex);
  }
}

function throwBindingFailedError(binding: OneWayBinding, ex: Error): never {
  throw new Error(`Binding "${binding.targetProperty}" -> "${binding.path}" failed: ${ex.message}`);
}

function createOneWayBindingDesc(target: WidgetInterface, targetProperty: string, path: string): OneWayBinding {
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
  if (isUnchecked(target, targetProperty)) {
    throw new Error(`Can not bind to property "${targetProperty}" without type guard.`);
  }
  return {
    target, targetProperty, path, sourceProperty, sourceChangeEvent, targetPropertyType
  };
}

function checkBindingsApplied(ev: WidgetResizeEvent) {
  if (getOneWayBindings(ev.target)) {
    throw new Error('Could not resolve one-way binding on CustomComponent: Not appended to a @component');
  }
}

function getOneWayBindings(instance: Widget): OneWayBinding[] {
  return instance[oneWayBindingsKey];
}

function clearOneWayBindings(instance: Widget) {
  delete instance[oneWayBindingsKey];
}

const oneWayBindingsKey = Symbol();

interface OneWayBinding {
  path: string;
  target: Widget;
  targetProperty: string;
  targetPropertyType: BaseConstructor<any>;
  sourceProperty: string;
  sourceChangeEvent: string;
}
