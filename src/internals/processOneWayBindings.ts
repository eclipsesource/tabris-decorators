import 'reflect-metadata';
import {Widget} from 'tabris';
import {clearOneWayBindings, getOneWayBindings, OneWayBinding} from './applyJsxBindings';
import {subscribe} from './subscribe';
import {checkPropertyExists, WidgetInterface} from './utils-databinding';

export function processOneWayBindings(base: WidgetInterface, target: Widget) {
  const bindings = getOneWayBindings(target);
  if (bindings) {
    for (const binding of bindings) {
      initOneWayBinding(base, binding);
    }
    clearOneWayBindings(target);
  }
}

export function initOneWayBinding(base: WidgetInterface, binding: OneWayBinding) {
  checkPropertyExists(base, binding.path[0], errorPrefix(binding));
  const cancel = subscribe(base, binding.path, rawValue => {
    applyValue(binding, evaluateBinding(binding, rawValue));
  });
  base.on({dispose: cancel});
}

function evaluateBinding(binding: OneWayBinding, rawValue: any) {
  if (rawValue === undefined) {
    return binding.fallbackValue;
  }
  try {
    return binding.converter(rawValue);
  } catch (ex) {
    throw new Error(errorPrefix(binding) + 'Converter exception: ' + ex.message);
  }
}

function applyValue(binding: OneWayBinding, value: any) {
  binding.target[binding.targetProperty] = value;
}

function errorPrefix({type, targetProperty, bindingString}: Partial<OneWayBinding>): string {
  const isTemplate = type === 'template';
  return `${isTemplate ? 'Template binding' : 'Binding'} "${targetProperty}" -> "${bindingString}" failed: `;
}
