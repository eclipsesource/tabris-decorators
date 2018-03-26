import { Widget, WidgetCollection } from 'tabris';
import { ChangeEvent } from '../api/ChangeEvent';
import { typeGuards } from '../api/TypeGuards';
import { checkPathSyntax, isAppended } from '../internals/utils';
import { checkBindableType, checkIsComponent, checkPropertyExists, getPropertyStore, getPropertyType, isUnchecked, postAppendHandlers, WidgetInterface } from '../internals/utils';

interface TwoWayBinding {
  path: string;
  baseProperty: string;
  selector: string;
  targetProperty: string;
  targetKey: symbol;
  targetChangeEvent: string;
  baseChangeEvent: string;
}

export function createBoundProperty(baseProto: WidgetInterface, baseProperty: string, targetPath: string) {
  const binding = createTwoWayBindingDesc(targetPath, baseProperty);
  const basePropertyType = getPropertyType(baseProto, baseProperty);
  checkBindableType(binding.baseProperty, basePropertyType);
  Object.defineProperty(baseProto, baseProperty, {
    get(this: WidgetInterface) {
      try {
        checkIsComponent(this);
        if (!isAppended(this)) {
          return getPropertyStore(this).get(baseProperty);
        }
        let value = getPropertyStore(this).get(binding.targetKey)[binding.targetProperty];
        typeGuards.checkType(value, basePropertyType);
        return value;
      } catch (ex) {
        throw new Error(
          getBindingFailedErrorMessage(binding, `provide ${baseProto.constructor.name} property "${baseProperty}"`, ex)
        );
      }
    },
    set(this: WidgetInterface, value: any) {
      try {
        checkIsComponent(this);
        typeGuards.checkType(value, basePropertyType);
        if (!isAppended(this)) {
          getPropertyStore(this).set(baseProperty, value);
          this.trigger(binding.baseChangeEvent, new ChangeEvent(this, binding.baseChangeEvent, value));
          return;
        }
        getPropertyStore(this).get(binding.targetKey)[binding.targetProperty] = value;
      } catch (ex) {
        throw new Error(getBindingFailedErrorMessage(binding, 'update target value', ex));
      }
    }, enumerable: true, configurable: true
  });
  postAppendHandlers(baseProto).push(base => initTwoWayBinding(base, binding));
  setTimeout(() => {
    try {
      checkIsComponent(baseProto);
    } catch (ex) {
      // tslint:disable-next-line:no-console
      console.error(getBindingFailedErrorMessage(binding, 'initialize', ex));
    }
  });
}

function createTwoWayBindingDesc(path: string, baseProperty: string): TwoWayBinding {
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

function initTwoWayBinding(base: WidgetInterface, binding: TwoWayBinding) {
  try {
    const basePropertyType = getPropertyType(base, binding.baseProperty);
    const child = getChild(base, binding.selector);
    const propertyStore = getPropertyStore(base);
    checkPropertyExists(child, binding.targetProperty);
    if (isUnchecked(child, binding.targetProperty)) {
      throw new Error('Can not bind to advanced type without type guard.');
    }
    propertyStore.set(binding.targetKey, child);
    typeGuards.checkType(child[binding.targetProperty], basePropertyType);
    child.on(binding.targetChangeEvent, ({ value }) => {
      try {
        typeGuards.checkType(value, basePropertyType);
        base.trigger(binding.baseChangeEvent, new ChangeEvent(base, binding.baseChangeEvent, value));
      } catch (ex) {
        let action = `update ${child.constructor.name} property "${binding.targetProperty}"`;
        throw new Error(getBindingFailedErrorMessage(binding, action, ex)
        );
      }
    });
    if (propertyStore.has(binding.baseProperty)) {
      child[binding.targetProperty] = propertyStore.get(binding.baseProperty);
      propertyStore.delete(binding.baseProperty);
    } else {
      base.trigger(
        binding.baseChangeEvent,
        new ChangeEvent(base, binding.baseChangeEvent, child[binding.targetProperty])
      );
    }
  } catch (ex) {
    throw new Error(getBindingFailedErrorMessage(binding, 'initialize', ex));
  }
}

function getChild(base: WidgetInterface, selector: string) {
  let results = (base as any)._find(selector) as WidgetCollection<Widget>;
  if (results.length === 0) {
    throw new Error(`No widget matching "${selector}" was appended.`);
  } else if (results.length > 1) {
    throw new Error(`Multiple widgets matching "${selector}" were appended.`);
  }
  return results.first() as WidgetInterface;
}

function getBindingFailedErrorMessage(binding: TwoWayBinding, action: string, ex: Error) {
  return `Binding "${binding.baseProperty}" <-> "${binding.path}" failed to ${action}: ${ex.message}`;
}
