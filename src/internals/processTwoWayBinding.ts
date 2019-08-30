import { subscribe } from './subscribe';
import { checkPropertyExists, getChild, isUnchecked, WidgetInterface } from './utils-databinding';

export type TwoWayBindings = {
  [sourceProperty: string]: {selector: string, targetProperty: string};
};

export function processTwoWayBindings(
  base: WidgetInterface,
  baseProperty: string,
  bindings: TwoWayBindings
) {
  for (const sourceProperty in bindings) {
    initTwoWayBinding(
      base,
      baseProperty,
      sourceProperty,
      bindings[sourceProperty].selector,
      bindings[sourceProperty].targetProperty
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
    if (isUnchecked(target, targetProperty)) {
      throw new Error(`Target property "${targetProperty}" needs a type guard.`);
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
