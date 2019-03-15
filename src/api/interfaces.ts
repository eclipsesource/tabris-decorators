import { EventObject, PropertyChangedEvent } from 'tabris';
import { Listener, Listeners } from './Listeners';

export { Constructor, BaseConstructor, TypeGuard } from '../internals/utils';

export type ExtendedEvent<EventData, Target = {}> = EventObject<Target> & EventData;
export type ChangeEvent<Value, Target = {}> = PropertyChangedEvent<Target, Value>;
export type ChangeListener<Value, Target = {}> = Listener<ChangeEvent<Value, Target>>;
export type ChangeListeners<Value, Target = {}> = Listeners<ChangeEvent<Value, Target>>;

// Ensure @event can check the property type:
// tslint:disable-next-line:variable-name
export const ChangeListeners = Listeners;
