import { Composite } from 'tabris';
import { checkAccess, checkBindableType, checkBindingType, checkPropertyExists, createTwoWayBindingDesc, getChild, TwoWayBinding } from './binding-utils';
import { typeGuards } from './TypeGuards';
import { applyDecorator, ChangeEvent, checkIsComponent, getPropertyStore, getPropertyType, postAppendHandlers, WidgetInterface } from './utils';

export function bind(targetPath: string): (target: Composite, property: string) => void;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const targetPath = args[0] as string;
    createBoundProperty(baseProto, baseProperty, targetPath);
  });
}

export function createBoundProperty(baseProto: WidgetInterface, baseProperty: string, targetPath: string) {
  const binding = createTwoWayBindingDesc(targetPath, baseProperty);
  const basePropertyType = getPropertyType(baseProto, baseProperty);
  checkBindableType(binding.baseProperty, basePropertyType);
  Object.defineProperty(baseProto, baseProperty, {
    get(this: WidgetInterface) {
      checkAccess(this, binding);
      let value = getPropertyStore(this).get(binding.targetKey)[binding.targetProperty];
      checkBindingType(targetPath, value, basePropertyType);
      return value;
    },
    set(this: WidgetInterface, value: any) {
      checkAccess(this, binding);
      checkBindingType(targetPath, value, basePropertyType);
      getPropertyStore(this).get(binding.targetKey)[binding.targetProperty] = value;
    }, enumerable: true, configurable: true
  });
  postAppendHandlers(baseProto).push(base => initTwoWayBinding(base, binding));
}

function initTwoWayBinding(base: WidgetInterface, binding: TwoWayBinding) {
  try {
    checkIsComponent(base);
    const basePropertyType = getPropertyType(base, binding.baseProperty);
    let child = getChild(base, binding.selector);
    checkPropertyExists(child, binding.targetProperty);
    typeGuards.checkType(child[binding.targetProperty], basePropertyType);
    getPropertyStore(base).set(binding.targetKey, child);
    child.on(binding.targetChangeEvent, ({ value }) => {
      checkBindingType(binding.path, value, basePropertyType);
      base.trigger(binding.baseChangeEvent, new ChangeEvent(base, binding.baseChangeEvent, value));
    });
    base.trigger(
      binding.baseChangeEvent,
      new ChangeEvent(base, binding.baseChangeEvent, child[binding.targetProperty])
    );
  } catch (ex) {
    throw new Error(`Could not bind property "${binding.baseProperty}" to "${binding.path}": ${ex.message}`);
  }
}
