import {getJsxInfo} from './ExtendedJSX';
import {subscribe} from './subscribe';
import {checkPropertyExists, getChild, isUnchecked, WidgetInterface} from './utils-databinding';
import {injector} from '../api/Injector';
import {TwoWayBinding} from '../decorators/bind';

export type TwoWayBindingPaths = {
  [sourceProperty: string]: {selector: string, targetProperty: string}
};

export function processTwoWayBindings(
  base: WidgetInterface,
  binding: TwoWayBinding
) {
  for (const sourceProperty in binding.all) {
    initTwoWayBinding(
      base,
      binding.baseProperty,
      sourceProperty,
      binding.all[sourceProperty].selector,
      binding.all[sourceProperty].targetProperty
    );
  }
}

function initTwoWayBinding(
  base: WidgetInterface,
  baseProperty: string,
  sourceProperty: string,
  selector: string,
  targetProperty: string
) {
  try {
    const target = getChild(base, selector);
    checkPropertyExists(target, targetProperty);
    const jsxInfo = getJsxInfo(target);
    const processor = 'processor' in jsxInfo ? jsxInfo.processor : injector.jsxProcessor;
    if (isUnchecked(target, targetProperty)) {
      if (processor.unsafeBindings === 'error') {
        throw new Error(`Target property "${targetProperty}" requires an explicit type check.`);
      }
      console.warn(
        `Unsafe binding "${baseProperty}.${sourceProperty}" <-> "${selector}.${targetProperty}": `
        + `Target property "${targetProperty}" has no type check.`
      );
    }
    let suspend = false;
    const fallback = target[targetProperty];
    const cancelBase = subscribe(base, [baseProperty, sourceProperty], rawValue => {
      if (!suspend) {
        suspend = true;
        const finalValue = rawValue !== undefined ? rawValue : fallback;
        target[targetProperty] = finalValue;
        if (base[baseProperty]) {
          base[baseProperty][sourceProperty] = finalValue;
        }
        suspend = false;
      }
    });
    const cancelTarget = subscribe(target, [targetProperty], rawValue => {
      if (base[baseProperty] && !suspend) {
        suspend = true;
        const finalValue = rawValue !== undefined ? rawValue : fallback;
        base[baseProperty][sourceProperty] = finalValue;
        if (base[baseProperty] && base[baseProperty][sourceProperty] !== finalValue) {
          target[targetProperty] = base[baseProperty][sourceProperty];
        }
        suspend = false;
      }
    });
    base.on({dispose: () => {
      cancelBase();
      cancelTarget();
    }});
  } catch (ex) {
    throw new Error(
      `Binding "${baseProperty}.${sourceProperty}" <-> "${selector}.${targetProperty}" failed: ` + ex.message
    );
  }
}
