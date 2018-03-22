import { Widget, WidgetCollection } from 'tabris';
import { typeGuards } from './TypeGuards';
import { checkPathSyntax } from './utils';
import { ChangeEvent, checkAppended, checkBindableType, checkIsComponent, checkPropertyExists, getPropertyStore, getPropertyType, postAppendHandlers, WidgetInterface } from './utils';

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
        checkAccess(this, binding);
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
        checkAccess(this, binding);
        typeGuards.checkType(value, basePropertyType);
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
    let child = getChild(base, binding.selector);
    checkPropertyExists(child, binding.targetProperty);
    typeGuards.checkType(child[binding.targetProperty], basePropertyType);
    getPropertyStore(base).set(binding.targetKey, child);
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
    base.trigger(
      binding.baseChangeEvent,
      new ChangeEvent(base, binding.baseChangeEvent, child[binding.targetProperty])
    );
  } catch (ex) {
    throw new Error(getBindingFailedErrorMessage(binding, 'initialize', ex));
  }
}

function checkAccess(base: WidgetInterface, binding: TwoWayBinding) {
  checkIsComponent(base);
  checkAppended(base);
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
