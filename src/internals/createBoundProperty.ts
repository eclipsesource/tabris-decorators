import {PropertyChangedEvent} from 'tabris';
import {getJsxInfo} from './ExtendedJSX';
import {BaseConstructor, getPropertyType} from './utils';
import {checkIsComponent, checkPropertyExists, getChild, getPropertyStore, isAppended, isUnchecked, markAsUnchecked, parseTargetPath, postAppendHandlers, WidgetInterface} from './utils-databinding';
import {checkType} from '../api/checkType';
import {injector} from '../api/Injector';
import {TwoWayBinding} from '../decorators/bind';

interface BoundProperty {
  path: string;
  baseProperty: string;
  selector: string;
  targetProperty: string;
  targetKey: symbol;
  fallbackValueKey: symbol;
  targetChangeEvent: string;
  baseChangeEvent: string;
  basePropertyValueCheck: (value: any) => void;
}

export function createBoundProperty(config: TwoWayBinding) {
  const basePropertyType = getPropertyType(config.baseProto, config.baseProperty);
  const checkValue = createValueChecker(config.userType || basePropertyType, config.typeGuard);
  const binding = createBoundPropertyDesc(config.path, config.baseProperty, checkValue);
  const unchecked = basePropertyType === Object && !config.typeGuard && !config.userType;
  if (unchecked) {
    markAsUnchecked(config.baseProto, config.baseProperty);
  }
  Object.defineProperty(config.baseProto, config.baseProperty, {
    get(this: WidgetInterface) {
      try {
        checkIsComponent(this);
        let value: any;
        if (!isAppended(this)) {
          value = getPropertyStore(this).get(config.baseProperty);
        } else {
          value = getPropertyStore(this).get(binding.targetKey)[binding.targetProperty];
        }
        checkValue(value);
        return value;
      } catch (ex) {
        throw new Error(
          failedMsg(
            binding,
            `provide ${config.baseProto.constructor.name} property "${config.baseProperty}"`,
            ex.message
          )
        );
      }
    },
    set(this: WidgetInterface, value: any) {
      try {
        checkIsComponent(this);
        checkValue(value);
        if (!isAppended(this)) {
          getPropertyStore(this).set(config.baseProperty, value);
          this.trigger(binding.baseChangeEvent, {value});
          return;
        }
        applyValue(this, binding, value);
      } catch (ex) {
        throw new Error(failedMsg(binding, 'update target value', ex.message));
      }
    }, enumerable: true, configurable: true
  });
  postAppendHandlers(config.baseProto).push(base => initBoundProperty(base, binding));
  setTimeout(() => {
    try {
      checkIsComponent(config.baseProto);
    } catch (ex) {
      console.error(failedMsg(binding, 'initialize', ex.message));
    }
  });
}

function initBoundProperty(base: WidgetInterface, binding: BoundProperty) {
  try {
    const child = getChild(base, binding.selector);
    checkBindingSafety(child, binding, base);
    const propertyStore = getPropertyStore(base);
    propertyStore.set(binding.targetKey, child);
    const initialValue = child[binding.targetProperty];
    binding.basePropertyValueCheck(initialValue);
    propertyStore.set(binding.fallbackValueKey, initialValue);
    child.on({[binding.targetChangeEvent]: ({value}: PropertyChangedEvent<any, any>) => {
      try {
        binding.basePropertyValueCheck(value);
        base.trigger(binding.baseChangeEvent, {value});
      } catch (ex) {
        const action = `update ${child.constructor.name} property "${binding.targetProperty}"`;
        throw new Error(failedMsg(binding, action, ex.message)
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
    throw new Error(failedMsg(binding, 'initialize', ex.message));
  }
}

function checkBindingSafety(child: WidgetInterface, binding: BoundProperty, base: WidgetInterface) {
  checkPropertyExists(base, binding.baseProperty);
  if (isUnchecked(base, binding.baseProperty)) {
    if (inStrictMode(base)) {
      throw new Error('Left hand property requires explicit type check.');
    }
    console.warn(unsafeMsg(binding, base, 'Left hand property has no type check.'));
  }
  checkPropertyExists(child, binding.targetProperty);
  if (isUnchecked(child, binding.targetProperty)) {
    if (inStrictMode(child)) {
      throw new Error('Right hand property requires explicit type check.');
    }
    console.warn(unsafeMsg(binding, base, 'Right hand property has no type check.'));
  }
}

function inStrictMode(child: WidgetInterface) {
  const jsxInfo = getJsxInfo(child);
  const processor = 'processor' in jsxInfo ? jsxInfo.processor : injector.jsxProcessor;
  return processor.strictMode;
}

function applyValue(base: WidgetInterface, binding: BoundProperty, value: any) {
  const propertyStore = getPropertyStore(base);
  const finalValue = value !== undefined ? value : propertyStore.get(binding.fallbackValueKey);
  propertyStore.get(binding.targetKey)[binding.targetProperty] = finalValue;
}

function unsafeMsg(binding: BoundProperty, base: WidgetInterface, msg: string) {
  return `Unsafe two-way binding "${base}.${binding.baseProperty}" <-> "${binding.path}": ${msg}`;
}

function failedMsg(binding: BoundProperty, action: string, msg: string) {
  return `Binding "${binding.baseProperty}" <-> "${binding.path}" failed to ${action}: ${msg}`;
}

function createBoundPropertyDesc(
  path: string,
  baseProperty: string,
  basePropertyValueCheck: (value: any) => void
): BoundProperty {
  const {selector, targetProperty} = parseTargetPath(path);
  return {
    path,
    selector,
    targetProperty,
    baseProperty,
    basePropertyValueCheck,
    targetKey: Symbol(baseProperty + 'Target'),
    fallbackValueKey: Symbol(baseProperty + 'FallbackValue'),
    targetChangeEvent: targetProperty + 'Changed',
    baseChangeEvent: baseProperty + 'Changed'
  };
}

function createValueChecker(type: BaseConstructor<any>, typeGuard: (v: any) => boolean) {
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
