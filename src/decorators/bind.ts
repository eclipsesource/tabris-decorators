import { Composite } from 'tabris';
import { property } from './property';
import { createBoundProperty } from '../internals/createBoundProperty';
import { processTwoWayBindings, TwoWayBindings } from '../internals/processTwoWayBinding';
import { applyDecorator, getPropertyType, isPrimitiveType } from '../internals/utils';
import { checkIsComponent, checkPropertyExists, isUnchecked, parseTargetPath, postAppendHandlers, TypeGuard, WidgetInterface } from '../internals/utils-databinding';

export interface BindAllConfig<ValidKeys extends string> {
  typeGuard?: TypeGuard;
  all: AllBindings<ValidKeys>;
}

export type AllBindings<ValidKeys extends string> = {
  [T in ValidKeys]?: string
};

export interface BindSingleConfig {
  typeGuard?: TypeGuard;
  path: string;
}

export type BindAllDecorator<ValidKeys extends string> = <
  PropertyName extends string,
  Target extends {[P in PropertyName]: {[SubProperty in ValidKeys]: any}} & Composite
>(
  target: Target, property: PropertyName
) => void;

export type BindSingleDecorator = (target: Composite, property: string) => void;

/**
 * A decorator for instance properties on classes extending `Composite`.
 *
 * Creates a two-way binding between the decorated property and the property given via the path parameter:
 *
 *  ```
 * ‍@bind(path: '#childId.property')
 * public componentProperty: SomeType = initialValue;
 * ```
 *
 * It's also possible to bind to properties of the object in the component property:
 *
 *  ```
 * ‍@bind(all: {
 *  someTypePropertyA: '#childId1.property'
 *  someTypePropertyB: '#childId2.property'
 * }})
 * public componentProperty: SomeType = initialValue;
 * ```
 *
 * The bindings are established after `append` is called the first time on the base widget.
 *
 * Like `@property` it supports type guards, which are required for some advanced types.
 *
 * `@bind` only works on classes decorated with `@component`.
 *
 * `@bindAll(bindigns)` can be used al a shorthand for `@bind({all: bindigns})`
 */
export function bind<ValidKeys extends string>(config: BindAllConfig<ValidKeys>): BindAllDecorator<ValidKeys>;
export function bind(config: BindSingleConfig | string): BindSingleDecorator;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const targetPath = typeof args[0] === 'string' ? args[0] : args[0].path;
    const typeGuard = typeof args[0] === 'string' ? undefined : args[0].typeGuard;
    const all = typeof args[0] === 'string' ? undefined : args[0].all;
    checkParameters(targetPath, all);
    if (targetPath) {
      createBoundProperty(baseProto, baseProperty, targetPath, typeGuard);
    } else {
      checkObjectProperty(baseProto, baseProperty);
      const bindings = parseAll(all);
      property(createTypGuard(Object.keys(bindings), typeGuard))(baseProto, baseProperty);
      postAppendHandlers(baseProto).push(
        base => processTwoWayBindings(base, baseProperty, bindings)
      );
    }
    setTimeout(() => {
      try {
        checkIsComponent(baseProto);
      } catch (ex) {
        // tslint:disable-next-line:no-console
        console.error('Can not apply @bind to property ' + baseProperty, ex);
      }
    });
  });
}

function checkParameters(targetPath: string, all: object) {
  if (targetPath && all) {
    throw new Error('@bind can not have "path" and "all" option simultaneously');
  }
  if (!targetPath && !Object.keys(all).length) {
    throw new Error('Missing binding path(s)');
  }
}

function checkObjectProperty(baseProto: WidgetInterface, baseProperty: string) {
  if (isPrimitiveType(getPropertyType(baseProto, baseProperty))) {
    throw new Error('Property type needs to extend Object');
  }
}

function parseAll(all: {[key: string]: string}): TwoWayBindings {
  const bindings: TwoWayBindings = {};
  for (const key in all) {
    bindings[key] = parseTargetPath(all[key]);
  }
  return bindings;
}

function createTypGuard(sourceProperties: string[], userTypeGuard: TypeGuard) {
  return (value: any) => {
    if (value) {
      for (const sourceProperty of sourceProperties) {
        checkPropertyExists(value, sourceProperty, 'Object');
        if (isUnchecked(value, sourceProperty)) {
          throw new Error(`Object property "${sourceProperty}" needs a type guard.`);
        }
      }
    }
    return userTypeGuard ? userTypeGuard(value) : true;
  };
}
