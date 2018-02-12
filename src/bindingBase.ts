import 'reflect-metadata';
import { Widget } from 'tabris';
import { OneWayBinding, checkBindingType, checkPropertyExists } from './data-binding';
import { getOneWayBindings } from './data-binding';
import {
  BaseConstructor,
  applyClassDecorator,
  ClassDecoratorFactory,
  postAppendHandlers,
  checkType
} from './utils';

export default function bindingBase(type: BaseConstructor<Widget>): void;
export default function bindingBase(...args: any[]): void | ClassDecoratorFactory<Widget> {
  return applyClassDecorator('bindingBase', args, (type: BaseConstructor<Widget>) => {
    postAppendHandlers(type.prototype).push(base => {
      base._find().forEach(child => processBindings(base, child, getOneWayBindings(child)));
    });
  });
}

function processBindings(base: Widget, target: Widget, bindings: OneWayBinding[]) {
  if (bindings) {
    for (let binding of bindings) {
      initOneWayBinding(base, binding);
    }
  }
}

function initOneWayBinding(base: Widget, binding: OneWayBinding) {
  try {
    checkPropertyExists(base, binding.sourceProperty, 'Base');
    checkType(base[binding.sourceProperty], binding.targetPropertyType);
    base.on(binding.sourceChangeEvent, ({value}) => {
      checkBindingType(binding.path, value, binding.targetPropertyType);
      binding.target[binding.targetProperty] = value;
    });
    binding.target[binding.targetProperty] = base[binding.sourceProperty];
  } catch (ex) {
    throw new Error(`Could not bind property "${binding.targetProperty}" to "${binding.path}": ${ex.message}`);
  }
}
