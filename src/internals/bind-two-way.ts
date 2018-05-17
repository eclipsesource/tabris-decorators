import { Widget, WidgetCollection } from 'tabris';
import { ChangeEvent } from '../api/ChangeEvent';
import { checkType } from '../api/checkType';
import { TypeGuard } from '../index';
import { BaseConstructor, checkPathSyntax, isAppended } from '../internals/utils';
import { checkIsComponent, checkPropertyExists, getPropertyStore, getPropertyType, isUnchecked, postAppendHandlers, WidgetInterface } from '../internals/utils';

export function createBoundProperty(
  baseProto: WidgetInterface,
  baseProperty: string,
  targetPath: string,
  typeGuard: TypeGuard
) {
  const basePropertyType = getPropertyType(baseProto, baseProperty);
  if (!typeGuard && basePropertyType === Object) {
    throw new Error(`Can not bind to property "${baseProperty}" without type guard.`);
  }
  let typeChecker = createTypeChecker(basePropertyType, typeGuard);
  const binding = createTwoWayBindingDesc(targetPath, baseProperty, typeChecker);
  Object.defineProperty(baseProto, baseProperty, {
    get(this: WidgetInterface) {
      try {
        checkIsComponent(this);
        let value: any;
        if (!isAppended(this)) {
          value = getPropertyStore(this).get(baseProperty);
        } else {
          value = getPropertyStore(this).get(binding.targetKey)[binding.targetProperty];
        }
        typeChecker(value);
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
        typeChecker(value);
        if (!isAppended(this)) {
          getPropertyStore(this).set(baseProperty, value);
          this.trigger(binding.baseChangeEvent, new ChangeEvent(this, binding.baseChangeEvent, value));
          return;
        }
        applyValue(this, binding, value);
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

function createTwoWayBindingDesc(
  path: string,
  baseProperty: string,
  basePropertyChecker: (value: any) => void
): TwoWayBinding {
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
    basePropertyChecker,
    targetKey: Symbol(baseProperty + 'Target'),
    fallbackValueKey: Symbol(baseProperty + 'FallbackValue'),
    targetChangeEvent: targetProperty + 'Changed',
    baseChangeEvent: baseProperty + 'Changed'
  };
}

function initTwoWayBinding(base: WidgetInterface, binding: TwoWayBinding) {
  try {
    const child = getChild(base, binding.selector);
    const propertyStore = getPropertyStore(base);
    checkPropertyExists(child, binding.targetProperty);
    if (isUnchecked(child, binding.targetProperty)) {
      throw new Error(`Can not bind to property "${binding.targetProperty}" without type guard.`);
    }
    propertyStore.set(binding.targetKey, child);
    const initialValue = child[binding.targetProperty];
    binding.basePropertyChecker(initialValue);
    propertyStore.set(binding.fallbackValueKey, initialValue);
    child.on(binding.targetChangeEvent, ({value}) => {
      try {
        binding.basePropertyChecker(value);
        base.trigger(binding.baseChangeEvent, new ChangeEvent(base, binding.baseChangeEvent, value));
      } catch (ex) {
        let action = `update ${child.constructor.name} property "${binding.targetProperty}"`;
        throw new Error(getBindingFailedErrorMessage(binding, action, ex)
        );
      }
    });
    if (propertyStore.has(binding.baseProperty)) {
      applyValue(base, binding, propertyStore.get(binding.baseProperty));
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

function applyValue(base: WidgetInterface, binding: TwoWayBinding, value: any) {
  const propertyStore = getPropertyStore(base);
  const finalValue = value !== undefined ? value : propertyStore.get(binding.fallbackValueKey);
  propertyStore.get(binding.targetKey)[binding.targetProperty] = finalValue;
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

function createTypeChecker(type: BaseConstructor<any>, typeGuard: (v: any) => void) {
  if (typeGuard) {
    return (value: any) => {
      if (!typeGuard(value)) {
        throw new Error(`Type guard rejected value "${value}".`);
      }
    };
  }
  return (value: any) => {
    checkType(value, type);
  };
}

interface TwoWayBinding {
  path: string;
  baseProperty: string;
  selector: string;
  targetProperty: string;
  targetKey: symbol;
  fallbackValueKey: symbol;
  targetChangeEvent: string;
  baseChangeEvent: string;
  basePropertyChecker: (value: any) => void;
}
