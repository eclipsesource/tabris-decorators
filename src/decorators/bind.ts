import {Composite} from 'tabris';
import {CustomPropertyDecorator, PropertySuperConfig, Converter} from './property';
import {Injector, injector} from '../api/Injector';
import {CustomPropertyDescriptor} from '../internals/CustomPropertyDescriptor';
import {TwoWayBinding} from '../internals/TwoWayBinding';
import {applyDecorator, getPropertyType, isPrimitiveType} from '../internals/utils';
import {checkIsComponent, checkPropertyExists, parseTargetPath, postAppendHandlers, TargetPath, WidgetInterface, BindingConverter, MultipleBindings, BindingValue} from '../internals/utils-databinding';

export type BindAllConfig<T> = PropertySuperConfig<T> & {
  all: MultipleBindings<T>
};

export type BindSingleConfig<T> = Omit<PropertySuperConfig<T>, 'convert'> & {
  path: string,
  convert?: Converter<T> | {property?: Converter<T>, binding?: BindingConverter<any>}
};

export type BindSuperConfig<T> = Omit<PropertySuperConfig<T>, 'convert'> & {
  componentProto: WidgetInterface,
  componentProperty: string,
  targetPath: TargetPath | null,
  all: MultipleBindingsInternal | null,
  convert: {property?: Converter<T>, binding?: BindingConverter<any>}
};

export type BindingInternal = {
  path: TargetPath,
  converter: BindingConverter
};

export type MultipleBindingsInternal = {
  [sourceProperty: string]: BindingInternal[] | null
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
 * * *`@bind(path, converter)` is the same as `@bind({path: path, converter: {binding: converter}})`.*
 * * *In addition to id selectors, type selectors and `:host` are also supported.*
 */
export function bind<T>(
  config: string,
  bindingConverter?: BindingConverter<any>
 ): CustomPropertyDecorator<T>;

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
 * * *`@bind(path, converter)` is the same as `@bind({path: path, converter: {binding: converter}})`.*
 * * *In addition to id selectors, type selectors and `:host` are also supported.*
 */
export function bind<T>(config: BindSingleConfig<T>): CustomPropertyDecorator<T>;

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
      convert: getConverter(isShorthand, args),
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

function getConverter(isShorthand: boolean, args: any[]): BindSuperConfig<any>['convert'] {
  if (isShorthand) {
    return args.length === 2 ? {binding: args[1]} : null;
  }
  if (args[0].convert instanceof Function || typeof args[0].convert === 'string') {
    return {property: args[0].convert};
  }
  return args[0].convert || null;
}

function configureComponentProperty(binding: BindSuperConfig<any>) {
  const {componentProto, componentProperty, convert, ...config} = binding;
  config.typeGuard = binding.all ? createBindAllTypeGuard(binding) : binding.typeGuard;
  const desc = CustomPropertyDescriptor.get(componentProto, componentProperty);
  if (binding.targetPath && binding.targetPath[0] !== '>>') {
    if (desc.hasDataSource) {
      throw new Error('Property can only receive values from one source');
    }
    desc.hasDataSource = true;
  }
  desc.addConfig(config);
  if (convert?.property) {
    desc.addConfig({convert: convert.property});
  }
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

function parseAll(all: MultipleBindings<any>): MultipleBindingsInternal | null {
  if (!all) {
    return null;
  }
  const bindings: MultipleBindingsInternal = {};
  for (const key in all) {
    if (!all[key]) {
      continue;
    }
    const bindingValues: BindingValue[] = all[key] instanceof Array
      ? all[key] as BindingValue[]
      : [all[key] as BindingValue];
    bindings[key] = bindingValues.map(value => ({
      path: parseTargetPath(value instanceof Object ? value.path : value),
      converter: value instanceof Object ? value.converter : null
    }));
    if (countReceivingBindings(bindings[key]) > 1) {
      throw new Error(`Property "${key}" is receiving values from multiple bindings`);
    }
  }
  return bindings;
}

function countReceivingBindings(bindings: BindingInternal[]): number {
  return bindings
    .map(({path}) => (path[0] === '>>' ? 0 : 1) as number)
    .reduce((prev, current) => prev + current);
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
        checkPropertyExists(value, sourceProperty, 'Object ');
        if (
          CustomPropertyDescriptor.isUnchecked(value, sourceProperty)
          && isReceiving(binding.all[sourceProperty])
        ) {
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

function isReceiving(bindings: BindingInternal[]) {
  return bindings.some(({path}) => path[0] !== '>>');
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
