import { Composite, EventObject, Page, PropertyChangedEvent, Tab } from 'tabris';
import { Diff, Listener, Listeners } from './Listeners';

export { Constructor, BaseConstructor, TypeGuard } from '../internals/utils';

export type ExtendedEvent<EventData, Target = {}> = EventObject<Target> & EventData;
export type ChangeEvent<Value, Target = {}> = PropertyChangedEvent<Target, Value>;
export type ChangeListener<Value, Target = {}> = Listener<ChangeEvent<Value, Target>>;
export type ChangeListeners<Value, Target = {}> = Listeners<ChangeEvent<Value, Target>>;

// Ensure @event can check the property type:
// tslint:disable-next-line:variable-name
export const ChangeListeners = Listeners;

export type UnpackListeners<T> = T extends Listeners<infer U> ? Listener<U> : T;
export type UnpackAllListeners<T> = { [Key in keyof T]: UnpackListeners<T[Key]>};
export type ComponentExtensionsJSX<T> = Partial<{ [Key in Diff<keyof T, keyof Composite>]: UnpackListeners<T[Key]>}>;

/**
 * Use this type to enabled proper JSX support for your component like this:
 * ```ts
 * ‍@component class MyComponent extends Composite {
 *   private jsxProperties: ComponentJSX<this>;
 * }
 * ```
 */
export type ComponentJSX<T> = JSX.CompositeProperties & ComponentExtensionsJSX<T>;
