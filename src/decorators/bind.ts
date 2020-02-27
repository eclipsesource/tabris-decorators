import {Composite} from 'tabris';
import {property} from './property';
import {Injector, injector} from '../api/Injector';
import {createBoundProperty} from '../internals/createBoundProperty';
import {processTwoWayBindings, TwoWayBindingPaths} from '../internals/processTwoWayBinding';
import {applyDecorator, getPropertyType, isPrimitiveType} from '../internals/utils';
import {checkIsComponent, checkPropertyExists, isUnchecked, parseTargetPath, postAppendHandlers, TypeGuard, UserType, WidgetInterface} from '../internals/utils-databinding';

export interface BindAllConfig<ValidKeys extends string> {
  typeGuard?: TypeGuard;
  all: AllBindings<ValidKeys>;
}

export type AllBindings<ValidKeys extends string> = {
  [T in ValidKeys]?: string
};

export interface BindSingleConfig {
  type?: UserType<any>;
  typeGuard?: TypeGuard;
  path: string;
}

export type TwoWayBinding = {
  baseProto: WidgetInterface,
  baseProperty: string,
  path: string | null,
  all: TwoWayBindingPaths | null,
  typeGuard: TypeGuard | null,
  userType: UserType<any> | null
};

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
 * componentProperty: SomeType = initialValue;
 * ```
 *
 * It's also possible to bind to properties of the object in the component property:
 *
 *  ```
 * ‍@bind(all: {
 *  someTypePropertyA: '#childId1.property'
 *  someTypePropertyB: '#childId2.property'
 * }})
 * componentProperty: SomeType = initialValue;
 * ```
 *
 * The bindings are established after `append` is called the first time on the base widget.
 *
 * Like `@property` it supports type guards, which are required for some advanced types.
 *
 * `@bind` only works on classes decorated with `@component`.
 *
 * `@bindAll(bindings)` can be used al a shorthand for `@bind({all: bindings})`
 */
export function bind<ValidKeys extends string>(config: BindAllConfig<ValidKeys>): BindAllDecorator<ValidKeys>;
export function bind(config: BindSingleConfig | string): BindSingleDecorator;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const isShorthand = typeof args[0] === 'string';
    const binding: TwoWayBinding = {
      baseProto,
      baseProperty,
      path: isShorthand ? args[0] : args[0].path,
      all: parseAll(isShorthand ? null : args[0].all),
      typeGuard: isShorthand ? null : args[0].typeGuard,
      userType:  isShorthand ? null : args[0].type
    };
    checkParameters(binding);
    applyTwoWayBinding(binding);
    setTimeout(() => {
      try {
        checkIsComponent(baseProto);
      } catch (ex) {
        console.error('Can not apply @bind to property ' + baseProperty, ex);
      }
    });
  });
}

function applyTwoWayBinding(binding: TwoWayBinding) {
  if (binding.path) {
    createBoundProperty(binding);
  } else {
    checkBasePropertyType(binding);
    const propertyConfig = {
      typeGuard: createTypeGuard(binding),
      type: binding.userType
    };
    property(propertyConfig)(binding.baseProto, binding.baseProperty);
    postAppendHandlers(binding.baseProto).push(base => processTwoWayBindings(base, binding));
  }
}

function checkParameters(binding: TwoWayBinding) {
  if (binding.path && binding.all) {
    throw new Error('@bind can not have "path" and "all" option simultaneously');
  }
  if (!binding.path && !Object.keys(binding.all).length) {
    throw new Error('Missing binding path(s)');
  }
}

function checkBasePropertyType(binding: TwoWayBinding) {
  const {baseProto, baseProperty, userType} = binding;
  const type = userType || getPropertyType(baseProto, baseProperty);
  if (isPrimitiveType(type)) {
    throw new Error('Property type needs to extend Object');
  }
}

function parseAll(all: {[key: string]: string}): TwoWayBindingPaths | null {
  if (!all) {
    return null;
  }
  const bindings: TwoWayBindingPaths = {};
  for (const key in all) {
    bindings[key] = parseTargetPath(all[key]);
  }
  return bindings;
}

function createTypeGuard(binding: TwoWayBinding) {
  const sourceProperties = Object.keys(binding.all);
  const baseProperty = binding.baseProperty;
  return (value: any) => {
    if (value) {
      if (!(value instanceof Object)) {
        throw new Error('Value needs to extend Object');
      }
      const className = binding.baseProto.constructor.name;
      for (const sourceProperty of sourceProperties) {
        checkPropertyExists(value, sourceProperty, 'Object');
        if (isUnchecked(value, sourceProperty)) {
          const strictMode = Injector.get(value, injector).jsxProcessor.unsafeBindings === 'error';
          if (strictMode) {
            throw new Error(`Object property "${sourceProperty}" requires an explicit type check.`);
          }
          const constructor = value.constructor === Object ? null : value.constructor;
          const valueDesc = constructor ? constructor.name : 'the assigned object';
          console.warn(
            `Unsafe two-way binding to ${className} property "${baseProperty}": `
            + `Property "${sourceProperty}" of ${valueDesc} has no type check.`
          );
        }
      }
    }
    return binding.typeGuard ? binding.typeGuard(value) : true;
  };
}
