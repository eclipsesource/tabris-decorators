import {Composite} from 'tabris';
import {property} from './property';
import {Injector, injector} from '../api/Injector';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {TwoWayBinding} from '../internals/TwoWayBinding';
import {applyDecorator, getPropertyType, isPrimitiveType} from '../internals/utils';
import {checkIsComponent, checkPropertyExists, parseTargetPath, postAppendHandlers, TargetPath, TypeGuard, UserType, WidgetInterface} from '../internals/utils-databinding';

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

export type BindSuperConfig = {
  componentProto: WidgetInterface,
  componentProperty: string,
  targetPath: TargetPath | null,
  all: TwoWayBindingPaths | null,
  typeGuard: TypeGuard | null,
  userType: UserType<any> | null
};

export type TwoWayBindingPaths = {
  [sourceProperty: string]: TargetPath
};

export type BindAllDecorator<ValidKeys extends string> = <
  PropertyName extends string,
  Target extends {[P in PropertyName]: {[SubProperty in ValidKeys]: any}} & Composite
>(
  target: Target, property: PropertyName
) => void;

export type BindSingleDecorator = (target: Composite, property: string) => void;

/**
 * A decorator for instance properties of classes extending `Composite`, i.e. a custom component.
 * It creates a two-way binding between the decorated property and a child (direct or indirect)
 * of the component. Example:
 *
 * ```ts
 * ‍@bind('#childId.text')
 * myProp: string = 'foo';
 * ```
 *
 * *Notes:*
 * * *`@bind` behaves like `@property` in most regards.*
 * * *Like `@property` it also supports the `typeGuard` and `type` options.*
 * * *Use`@bind({all: bindings})` or `@bindAll(bindings)` to create bindings to a model.*
 * * *`@bind(path)` is the same as `@bind({path: path})`.*
 */
export function bind(config: BindSingleConfig | string): BindSingleDecorator;

/**
 * A decorator for instance properties of classes extending `Composite`, i.e. a custom component.
 * It creates a two-way binding between properties of a model (e.g. an object using `@property`)
 * and children (direct or indirect) of the component. Example:
 *
 * ```ts
 * ‍@bind(all: {
 *  modelPropA: '#childId1.text'
 *  modelPropB: '#childId2.selection'
 * }})
 * myProp: MyModel;
 * ```
 *
 * *Notes:*
 * * *`@bind` behaves like `@property` in most regards.*
 * * *Like `@property` it also supports the `typeGuard` and `type` options.*
 * * *Use`@bind(path)` or `@bind({path: path})` to create bindings to the component property itself.*
 * * *`@bindAll(bindings)` can be used as a shorthand for `@bind({all: bindings})`.*
 */
export function bind<ValidKeys extends string>(config: BindAllConfig<ValidKeys>): BindAllDecorator<ValidKeys>;

export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const isShorthand = typeof args[0] === 'string';
    const pathString = isShorthand ? args[0] : args[0].path;
    const config: BindSuperConfig = {
      componentProto: baseProto,
      componentProperty: baseProperty,
      targetPath: pathString ? parseTargetPath(pathString) : null,
      all: parseAll(isShorthand ? null : args[0].all),
      typeGuard: isShorthand ? null : args[0].typeGuard,
      userType:  isShorthand ? null : args[0].type
    };
    checkParameters(config);
    preCheckComponentProperty(config);
    configureComponentProperty(config);
    postAppendHandlers(config.componentProto).push(
      component => TwoWayBinding.create(component, config)
    );
    scheduleIsComponentCheck(config);
  });
}

function configureComponentProperty(binding: BindSuperConfig) {
  const propertyConfig = {
    typeGuard: binding.all ? createBindAllTypeGuard(binding) : binding.typeGuard,
    type: binding.userType
  };
  property(propertyConfig)(binding.componentProto, binding.componentProperty);
}

function checkParameters(binding: BindSuperConfig) {
  if (binding.targetPath && binding.all) {
    throw new Error('@bind can not have "path" and "all" option simultaneously');
  }
  if (!binding.targetPath && !Object.keys(binding.all).length) {
    throw new Error('Missing binding path(s)');
  }
}

function preCheckComponentProperty(binding: BindSuperConfig) {
  if (binding.targetPath) {
    // Will be checked on initialization
    return;
  }
  const {componentProto: baseProto, componentProperty: baseProperty, userType} = binding;
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

function createBindAllTypeGuard(binding: BindSuperConfig) {
  const sourceProperties = Object.keys(binding.all);
  const baseProperty = binding.componentProperty;
  return (value: any) => {
    if (value) {
      if (!(value instanceof Object)) {
        throw new Error('Value needs to extend Object');
      }
      const className = binding.componentProto.constructor.name;
      for (const sourceProperty of sourceProperties) {
        checkPropertyExists(value, sourceProperty, 'Object');
        if (CustomPropertyDescriptor.isUnchecked(value, sourceProperty)) {
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

function scheduleIsComponentCheck(binding: BindSuperConfig) {
  setTimeout(() => {
    try {
      checkIsComponent(binding.componentProto);
    } catch (ex) {
      const target = binding.all ? JSON.stringify(binding.all) : binding.targetPath.join('.');
      console.error(
        `Binding "${binding.componentProperty}" <-> "${target}" failed to initialize: ` + ex.message
      );
    }
  });
}
