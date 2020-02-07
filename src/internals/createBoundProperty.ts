import {PropertyChangedEvent} from 'tabris';
import {BaseConstructor, getPropertyType} from './utils';
import {checkIsComponent, checkPropertyExists, getChild, getPropertyStore, isAppended, isUnchecked, parseTargetPath, postAppendHandlers, WidgetInterface} from './utils-databinding';
import {checkType} from '../api/checkType';
import {TypeGuard} from '../index';

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
  const typeChecker = createTypeChecker(basePropertyType, typeGuard);
  const binding = createBoundPropertyDesc(targetPath, baseProperty, typeChecker);
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
          this.trigger(binding.baseChangeEvent, {value});
          return;
        }
        applyValue(this, binding, value);
      } catch (ex) {
        throw new Error(getBindingFailedErrorMessage(binding, 'update target value', ex));
      }
    }, enumerable: true, configurable: true
  });
  postAppendHandlers(baseProto).push(base => initBoundProperty(base, binding));
  setTimeout(() => {
    try {
      checkIsComponent(baseProto);
    } catch (ex) {
      console.error(getBindingFailedErrorMessage(binding, 'initialize', ex));
    }
  });
}

function createBoundPropertyDesc(
  path: string,
  baseProperty: string,
  basePropertyChecker: (value: any) => void
): BoundProperty {
  const {selector, targetProperty} = parseTargetPath(path);
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

function initBoundProperty(base: WidgetInterface, binding: BoundProperty) {
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
    child.on({[binding.targetChangeEvent]: ({value}: PropertyChangedEvent<any, any>) => {
      try {
        binding.basePropertyChecker(value);
        base.trigger(binding.baseChangeEvent, {value});
      } catch (ex) {
        const action = `update ${child.constructor.name} property "${binding.targetProperty}"`;
        throw new Error(getBindingFailedErrorMessage(binding, action, ex)
        );
      }
    }});
    if (propertyStore.has(binding.baseProperty)) {
      applyValue(base, binding, propertyStore.get(binding.baseProperty));
      propertyStore.delete(binding.baseProperty);
    } else {
      base.trigger(
        binding.baseChangeEvent,
        {value: child[binding.targetProperty]}
      );
    }
  } catch (ex) {
    throw new Error(getBindingFailedErrorMessage(binding, 'initialize', ex));
  }
}

function applyValue(base: WidgetInterface, binding: BoundProperty, value: any) {
  const propertyStore = getPropertyStore(base);
  const finalValue = value !== undefined ? value : propertyStore.get(binding.fallbackValueKey);
  propertyStore.get(binding.targetKey)[binding.targetProperty] = finalValue;
}

function getBindingFailedErrorMessage(binding: BoundProperty, action: string, ex: Error) {
  return `Binding "${binding.baseProperty}" <-> "${binding.path}" failed to ${action}: ${ex.message}`;
}

function createTypeChecker(type: BaseConstructor<any>, typeGuard: (v: any) => boolean) {
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

interface BoundProperty {
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
