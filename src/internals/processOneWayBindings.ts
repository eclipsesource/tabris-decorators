import 'reflect-metadata';
import { Widget } from 'tabris';
import { clearOneWayBindings, getOneWayBindings, OneWayBinding } from './applyJsxBindings';
import { subscribe } from './subscribe';
import { checkPropertyExists, WidgetInterface } from './utils-databinding';

export function processOneWayBindings(base: WidgetInterface, target: Widget) {
  let bindings = getOneWayBindings(target);
  if (bindings) {
    for (let binding of bindings) {
      initOneWayBinding(base, binding);
    }
    clearOneWayBindings(target);
  }
}

export function initOneWayBinding(base: WidgetInterface, binding: OneWayBinding) {
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

function throwBindingFailedError({type, targetProperty, bindingString}: Partial<OneWayBinding>, ex: any): never {
  const isTemplate = type === 'template';
  throw new Error(
    `${isTemplate ? 'Template binding' : 'Binding'} "${targetProperty}" -> "${bindingString}" failed: ${ex.message}`
  );
}
