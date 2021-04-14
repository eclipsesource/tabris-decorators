import 'reflect-metadata';
import {Widget, WidgetResizeEvent} from 'tabris';
import {CustomPropertyDescriptor} from './CustomPropertyDescriptor';
import {Severity} from './ExtendedJSX';
import {checkPathSyntax, checkPropertyExists, WidgetInterface} from './utils-databinding';
import {Binding} from '../api/to';

const placeholder = /\$\{[^}]+\}/g;

export interface JsxBindings { [targetProperty: string]: string; }

export function applyJsxBindings(targetInstance: Widget, bindings: JsxBindings, safety: Severity) {
  const oneWayBindings: OneWayBinding[] = [];
  for (const attribute in bindings) {
    oneWayBindings.push(
      createOneWayBindingDesc(
          targetInstance as WidgetInterface,
          attribute,
          asBinding(bindings[attribute]),
          safety
      )
    );
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

function asBinding(value: any): Binding {
  return {
    path: value && value.path ? value.path.toString() : (value || '').toString(),
    converter: value.converter
  };
}

function createOneWayBindingDesc(
  target: WidgetInterface,
  attribute: string,
  binding: Binding,
  unsafe: Severity
): OneWayBinding {
  const type = getBindingType(attribute);
  const targetProperty = getTargetProperty(attribute);
  const bindingString = binding.path;
  const pathString = extractPath(type, bindingString);
  checkPathSyntax(pathString);
  if (pathString.startsWith('.') || pathString.startsWith('#')) {
    throw new Error(
      errorPrefix(attribute, bindingString)
      + 'JSX binding path can currently not contain a selector.'
    );
  }
  const path = pathString.split('.');
  checkPropertyExists(target, targetProperty, errorPrefix(attribute, bindingString));
  if (CustomPropertyDescriptor.isUnchecked(target, targetProperty)) {
    if (unsafe === 'error') {
      throw new Error(
        errorPrefix(attribute, bindingString)
        + `Can not bind to property "${targetProperty}" without explicit type check.`
      );
    }
    console.warn(
      `Unsafe binding "${targetProperty}" -> "${bindingString}": `
      + `Property "${targetProperty}" has no type check.`
    );
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
  const matches = bindingString.match(placeholder);
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

function compileTemplate(template: string) {
  return value => template.replace(placeholder, value);
}

function getBindingType(attribute: string): 'bind' | 'template' {
  return attribute.split('-')[0] as any;
}

function getTargetProperty(attribute: string): string {
  return attribute.split('-')[1];
}

function errorPrefix(attribute: string, binding: string): string {
  const type = getBindingType(attribute);
  const targetProperty = getTargetProperty(attribute);
  const isTemplate = type === 'template';
  return `${isTemplate ? 'Template binding' : 'Binding'} "${targetProperty}" -> "${binding}" failed: `;
}

const oneWayBindingsKey = Symbol();

export interface OneWayBinding {
  type: 'bind' | 'template';
  converter: (v: any) => string;
  bindingString: string;
  target: Widget;
  targetProperty: string;
  path: string[];
  fallbackValue: any;
}
