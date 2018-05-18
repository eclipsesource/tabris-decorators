import 'reflect-metadata';
import { Widget, WidgetResizeEvent } from 'tabris';
import { checkPathSyntax, checkPropertyExists, isUnchecked, WidgetInterface } from './utils';

export interface JsxBindings { [targetProperty: string]: string; }

export function applyJsxBindings(targetInstance: Widget, bindings: JsxBindings) {
  let oneWayBindings: OneWayBinding[] = [];
  for (let targetProperty in bindings) {
    try {
      oneWayBindings.push(
        createOneWayBindingDesc(targetInstance as WidgetInterface, targetProperty, bindings[targetProperty])
      );
    } catch (ex) {
      throwBindingFailedError(targetProperty, bindings[targetProperty], ex);
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
        applyValue(binding, evaluateBinding(base, binding));
      } catch (ex) {
        throwBindingFailedError(binding.targetProperty, binding.path, ex);
      }
    });
    applyValue(binding, evaluateBinding(base, binding));
  } catch (ex) {
    throwBindingFailedError(binding.targetProperty, binding.path, ex);
  }
}

function evaluateBinding(base: WidgetInterface, binding: OneWayBinding) {
  let baseValue = base[binding.sourceProperty];
  if (!binding.subProperty) {
    return baseValue;
  }
  return baseValue instanceof Object ? baseValue[binding.subProperty] : undefined;
}

function applyValue(binding: OneWayBinding, value: any) {
  binding.target[binding.targetProperty] = value !== undefined ? value : binding.fallbackValue;
}

function throwBindingFailedError(targetProperty: string, path: string, ex: Error): never {
  throw new Error(`Binding "${targetProperty}" -> "${path}" failed: ${ex.message}`);
}

function createOneWayBindingDesc(target: WidgetInterface, targetProperty: string, path: string): OneWayBinding {
  checkPathSyntax(path);
  if (path.startsWith('.') || path.startsWith('#')) {
    throw new Error('JSX binding path can currently not contain a selector.');
  }
  const segments = path.split('.');
  if (segments.length > 2) {
    throw new Error('JSX binding path can have no more than two segments.');
  }
  const sourceProperty = segments[0]; // TODO: support other sources than base
  const subProperty = segments[1];
  const sourceChangeEvent = sourceProperty + 'Changed';
  checkPropertyExists(target, targetProperty);
  if (isUnchecked(target, targetProperty)) {
    throw new Error(`Can not bind to property "${targetProperty}" without type guard.`);
  }
  const fallbackValue = target[targetProperty];
  return {
    target, targetProperty, path, sourceProperty, sourceChangeEvent, fallbackValue, subProperty
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
  subProperty: string;
  sourceProperty: string;
  sourceChangeEvent: string;
  fallbackValue: any;
}
