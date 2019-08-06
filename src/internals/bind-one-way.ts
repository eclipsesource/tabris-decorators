import 'reflect-metadata';
import { Widget, WidgetResizeEvent } from 'tabris';
import { subscribe } from './subscribe';
import { checkPathSyntax, checkPropertyExists, isUnchecked, WidgetInterface } from './utils';
import { Binding } from '../api/to';

const placeholder = /\$\{[^\}]+\}/g;

export interface JsxBindings { [targetProperty: string]: string; }

export function applyJsxBindings(targetInstance: Widget, bindings: JsxBindings) {
  let oneWayBindings: OneWayBinding[] = [];
  for (let attribute in bindings) {
    try {
      oneWayBindings.push(
        createOneWayBindingDesc(targetInstance as WidgetInterface, attribute, asBinding(bindings[attribute]))
      );
    } catch (ex) {
      throwBindingFailedError({
        type: getBindingType(attribute),
        targetProperty: getTargetProperty(attribute),
        bindingString: bindings[attribute]
      }, ex);
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

function asBinding(value: any): Binding {
  return {
    path: value && value.path ? value.path.toString() : (value || '').toString(),
    converter: value.converter
  };
}

function initOneWayBinding(base: WidgetInterface, binding: OneWayBinding) {
  try {
    checkPropertyExists(base, binding.path[0], base.constructor.name);
    const cancel = subscribe(base, binding.path, rawValue => {
      try {
        applyValue(binding, evaluateBinding(binding, rawValue));
      } catch (ex) {
        throwBindingFailedError(binding, ex);
      }
    });
    base.on({dispose: cancel});
  } catch (ex) {
    throwBindingFailedError(binding, ex);
  }
}

function evaluateBinding(binding: OneWayBinding, rawValue: any) {
  if (rawValue === undefined) {
    return binding.fallbackValue;
  }
  try {
    return binding.converter(rawValue);
  } catch (ex) {
    throw new Error('Converter exception: ' + ex.message);
  }
}

function applyValue(binding: OneWayBinding, value: any) {
  binding.target[binding.targetProperty] = value;
}

function createOneWayBindingDesc(target: WidgetInterface, attribute: string, binding: Binding): OneWayBinding {
  const type = getBindingType(attribute);
  const targetProperty = getTargetProperty(attribute);
  const bindingString = binding.path;
  const pathString = extractPath(type, bindingString);
  checkPathSyntax(pathString);
  if (pathString.startsWith('.') || pathString.startsWith('#')) {
    throw new Error('JSX binding path can currently not contain a selector.');
  }
  const path = pathString.split('.');
  checkPropertyExists(target, targetProperty);
  if (isUnchecked(target, targetProperty)) {
    throw new Error(`Can not bind to property "${targetProperty}" without type guard.`);
  }
  const fallbackValue = target[targetProperty];
  const converter = type === 'template' ? compileTemplate(bindingString) : (binding.converter || (v => v));
  return {
    bindingString, target, targetProperty, path, fallbackValue, type, converter
  };
}

function extractPath(type: 'bind' | 'template', bindingString: string) {
  if (type === 'bind') {
    return bindingString;
  }
  let matches = bindingString.match(placeholder);
  if (!matches) {
    throw new Error(`Template "${bindingString}" does not contain a valid placeholder`);
  }
  if (matches.length > 1) {
    throw new Error(`Template "${bindingString}" contains too many placeholder`);
  }
  return matches[0].substring(2, matches[0].length - 1);
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

function compileTemplate(template: string) {
  return value => template.replace(placeholder, value);
}

function getBindingType(attribute: string): 'bind' | 'template' {
  return attribute.split('-')[0] as any;
}

function getTargetProperty(attribute: string): string {
  return attribute.split('-')[1];
}

function throwBindingFailedError({type, targetProperty, bindingString}: Partial<OneWayBinding>, ex: any): never {
  const isTemplate = type === 'template';
  throw new Error(
    `${isTemplate ? 'Template binding' : 'Binding'} "${targetProperty}" -> "${bindingString}" failed: ${ex.message}`
  );
}

const oneWayBindingsKey = Symbol();

interface OneWayBinding {
  type: 'bind' | 'template';
  converter: (v: any) => string;
  bindingString: string;
  target: Widget;
  targetProperty: string;
  path: string[];
  fallbackValue: any;
}
