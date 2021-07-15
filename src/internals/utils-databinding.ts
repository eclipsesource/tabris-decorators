import {Composite, EventObject, Listeners, Selector, Widget, WidgetCollection} from 'tabris';
import {BaseConstructor, Constructor} from './utils';
import {Conversion} from './Conversion';

const postAppendHandlersKey = Symbol();
const wasAppendedKey = Symbol();
const propertyStoreKey = Symbol();
const componentKey = Symbol();

export const originalAppendKey = Symbol();

export type Direction = '<<' | '>>' | '';
export type WidgetInterface = {
  [prop: string]: any,
  [originalAppendKey]: typeof Composite.prototype.append,
  [wasAppendedKey]: boolean
} & Widget & WidgetProtected & EventTarget;
export type TypeGuard<T = any> = (v: T) => boolean;
export type UserType<T> = Constructor<T>;
export type WidgetProtected = {
  _find(selector?: Selector): WidgetCollection<Widget>,
  _find<U extends Widget>(constructor: new (...args: any[]) => U): WidgetCollection<U>
};
export type ParamInfo = {type: Constructor<any>, injectParam?: string, inject?: boolean};
export type PostAppendHandler = (widgetInstance: WidgetInterface) => void;
export type TargetPath = [Direction, string, string];
export type Binding = {
  path: string,
  converter?: BindingConverter
};
export type BoundListener<
  ComponentType extends Widget = Composite,
  EventObjectType extends object = EventObject<object>
> = (this: ComponentType, ev: EventObjectType) => any;

export type BindingValue = string | Binding;

type Bindable<
  ComponentType extends Widget = Composite,
  ModelType extends object = any
> = BindingValue | BindingValue[] | BoundListener<ComponentType, EventObject<ModelType>>;

export type MultipleBindings<
  ModelType extends object = any,
  ComponentType extends Widget = Composite,
> = {
  [Property in keyof ModelType]?: Bindable<ComponentType, ModelType>
};

export type BindingConverter<From = any, Target = any, TargetProperty extends string = any> = (
  v: From,
  conversion: Conversion<Target, TargetProperty>
) => any | void;

/**
 * Gets list of functions to be executed after first time append is called on instances of the given
 * widget prototype or instance.
 */
export function postAppendHandlers(widget: WidgetInterface) {
  if (!Reflect.getMetadata(postAppendHandlersKey, widget)) {
    Reflect.defineMetadata(postAppendHandlersKey, [], widget);
  }
  return Reflect.getMetadata(postAppendHandlersKey, widget) as PostAppendHandler[];
}

/**
 * Gets map for the purpose of storing property values of the given instance.
 */
export function getPropertyStore(instance: any): Map<string | symbol, any> {
  if (!instance[propertyStoreKey]) {
    instance[propertyStoreKey] = new Map<string | symbol, any>();
  }
  return instance[propertyStoreKey];
}

export function checkPropertyExists(
  targetWidget: any,
  targetProperty: string,
  errorPrefix: string = ''
) {
  let current = targetWidget;
  const targetName = targetWidget?.constructor?.name || 'Target';
  while (current) {
    const desc = Object.getOwnPropertyDescriptor(current, targetProperty);
    if (desc) {
      if (!desc.set) {
        throw new Error(
          `${targetName} property "${targetProperty}" has no setter, missing @prop / @property?`
        );
      }
      return;
    }
    current = Object.getPrototypeOf(current);
  }
  throw new Error(`${errorPrefix}${targetName} does not have a property "${targetProperty}".`);
}

export function trigger(target: Partial<EventTarget>, type: string, eventData: any) {
  Listeners.getListenerStore(target).trigger(type, eventData);
}

export function markAsAppended(widget: WidgetInterface) {
  widget[wasAppendedKey] = true;
}

export function isAppended(widget: WidgetInterface) {
  return !!widget[wasAppendedKey];
}

export function checkAppended(widget: WidgetInterface) {
  if (!isAppended(widget)) {
    throw new Error('No widgets have been appended yet.');
  }
}

export function parseTargetPath(targetPath: string): TargetPath {
  const {path, direction} = extractDirection(targetPath);
  checkPathSyntax(path);
  if (!/^[A-Z#.]/.test(path) && !path.startsWith(':host')) {
    throw new Error('Binding path must start with direction or selector.');
  }
  if (path.startsWith('.')) {
    throw new Error('Class selectors are not allowed.');
  }
  const segments = path.split('.');
  if (segments.length < 2) {
    throw new Error('Binding path needs at least two segments.');
  } else if (segments.length > 2) {
    throw new Error('Binding path has too many segments.');
  }
  return [direction, segments[0], segments[1]] as TargetPath;
}

export function checkPathSyntax(targetPath: string) {
  if (/\s|\[|\]|\(|\)|<|>/.test(targetPath)) {
    throw new Error('Binding path contains invalid characters.');
  }
}

function extractDirection(path: string): {path: string, direction: Direction} {
  if (path.startsWith('<') || path.startsWith('>')) {
    const split = /^(<<|>>)\s*(.*)$/.exec(path);
    if (!split || split.length !== 3) {
      throw new Error('Invalid path prefix.');
    }
    return {path: split[2], direction: split[1] as Direction};
  }
  return {path, direction: ''};
}

export function markAsComponent(type: BaseConstructor<Widget>) {
  Reflect.defineMetadata(componentKey, true, type.prototype);
}

export function checkIsComponent(widget: Widget) {
  if (!Reflect.getMetadata(componentKey, widget)) {
    throw new Error(`${widget.constructor.name} is not a @component`);
  }
}
