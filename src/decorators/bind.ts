import {Composite} from 'tabris';
import {CustomPropertyDecorator, PropertySuperConfig} from './property';
import {Injector, injector} from '../api/Injector';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {TwoWayBinding} from '../internals/TwoWayBinding';
import {applyDecorator, getPropertyType, isPrimitiveType} from '../internals/utils';
import {checkIsComponent, checkPropertyExists, parseTargetPath, postAppendHandlers, TargetPath, WidgetInterface} from '../internals/utils-databinding';

export type BindAllConfig<T> = PropertySuperConfig<T> & {
  all: {[Property in keyof T]?: string}
};

export type BindSingleConfig<T> = PropertySuperConfig<T> & {
  path: string
};

export type BindSuperConfig<T> = PropertySuperConfig<T> & {
  componentProto: WidgetInterface,
  componentProperty: string,
  targetPath: TargetPath | null,
  all: TwoWayBindingPaths | null
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
 * * *In addition to id selectors, type selectors and `:host` are also supported.*
 */
export function bind<T>(config: BindSingleConfig<T> | string): CustomPropertyDecorator<T>;

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
 * * *`@bind` behaves like `@property` and supports all the same configuration options.*
 * * *Use`@bind(path)` or `@bind({path: path})` to create bindings to the component property itself.*
 * * *`@bindAll(bindings)` can be used as a shorthand for `@bind({all: bindings})`.*
 * * *In addition to id selectors, type selectors and `:host` are also supported.*
 */
export function bind<T extends object>(config: BindAllConfig<T>): CustomPropertyDecorator<T>;

export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const isShorthand = typeof args[0] === 'string';
    const pathString = isShorthand ? args[0] : args[0].path;
    const config: BindSuperConfig<unknown> = {
      componentProto: baseProto,
      componentProperty: baseProperty,
      targetPath: pathString ? parseTargetPath(pathString) : null,
      all: parseAll(isShorthand ? null : args[0].all),
      typeGuard: isShorthand ? null : args[0].typeGuard,
      type: isShorthand ? null : args[0].type,
      equals: isShorthand ? null : args[0].equals || null,
      convert: isShorthand ? null : args[0].convert || null,
      nullable: isShorthand ? null : 'nullable' in args[0] ? args[0].nullable : null,
      default: isShorthand ? undefined : args[0].default
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

function configureComponentProperty(binding: BindSuperConfig<any>) {
  const {componentProto, componentProperty, ...config} = binding;
  config.typeGuard = binding.all ? createBindAllTypeGuard(binding) : binding.typeGuard;
  CustomPropertyDescriptor.get(componentProto, componentProperty).addConfig(config);
}

function checkParameters(binding: BindSuperConfig<any>) {
  if (binding.targetPath && binding.all) {
    throw new Error('@bind can not have "path" and "all" option simultaneously');
  }
  if (!binding.targetPath && !Object.keys(binding.all).length) {
    throw new Error('Missing binding path(s)');
  }
}

function preCheckComponentProperty(binding: BindSuperConfig<any>) {
  if (binding.targetPath) {
    // Will be checked on initialization
    return;
  }
  const {componentProto: baseProto, componentProperty: baseProperty} = binding;
  const type = binding.type || getPropertyType(baseProto, baseProperty);
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

function createBindAllTypeGuard(binding: BindSuperConfig<unknown>) {
  const sourceProperties = Object.keys(binding.all);
  const baseProperty = binding.componentProperty;
  return (value: any) => {
    if (value) {
      if (!(value instanceof Object)) {
        throw new Error('Value needs to extend Object');
      }
      const className = binding.componentProto.constructor.name;
      for (const sourceProperty of sourceProperties) {
        checkPropertyExists(value, sourceProperty);
        if (CustomPropertyDescriptor.isUnchecked(value, sourceProperty) && binding.all[sourceProperty][0] !== '>>') {
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

function scheduleIsComponentCheck(binding: BindSuperConfig<unknown>) {
  setTimeout(() => {
    try {
      checkIsComponent(binding.componentProto);
    } catch (ex) {
      const target = binding.all ? JSON.stringify(binding.all) : binding.targetPath.slice(1).join('.');
      console.error(
        `Binding "${binding.componentProperty}" <-> "${target}" failed to initialize: ` + ex.message
      );
    }
  });
}
