import { EventObject, NativeObject, PropertyChangedEvent } from 'tabris';
import { Constructor } from '../index';

export type Listener<T = {}> = (ev: CustomEvent<T>) => any;

export interface Listeners<T extends object = {}> {
  // tslint:disable-next-line:callable-types
  (listener: Listener<CustomEvent<T>>): void;
}

const DELEGATE_FIELDS = ['reject', 'resolve', 'addListener', 'removeListener', 'once', 'trigger'];

/**
 * The `Listeners` instance, usually created by `@event`, is a function to register listeners
 * and also doubles as an object that offers API to trigger events, de-register listeners and more.
 */
export class Listeners<T extends object = {}> {

  private store: UntypedListenerStore;

  constructor(
    public readonly target: object,
    public readonly type: string
  ) {
    this.store = this.target instanceof NativeObject ? this.target : new DefaultListenerStore();
    let delegate: Listeners<T> = this.addListener.bind(this);
    (delegate as any).target = this.target;
    (delegate as any).type = this.type;
    (delegate as any).original = this;
    for (let key of DELEGATE_FIELDS) {
      delegate[key] = this[key] = this[key].bind(this);
    }
    return delegate;
  }

  /**
   * Returns a promise that rejects ("throws" when using `async`) the next time an event is issued.
   * The "thrown" value will always be an instance of `Error`.
   * If an `Error` instance or class is given as an argument, the promise will reject with that error type.
   * Otherwise a plain `Error` instance will be created from the given value.
   */
  public async reject(value?: Error | Constructor<Error> | string | object): Promise<never> {
    let event = await this.resolve();
    let error: Error | null = null;
    if (value instanceof Error) {
      error = value;
    }
    if (!error && value instanceof Function && value.prototype instanceof Error) {
      try {
        error = new (value as any)();
      } catch { /* that's OK, try something else */ }
    }
    if (!error && (!value || value instanceof Object)) {
      error = new Error(`${this.type} fired`);
      Object.assign(error, value || event);
    }
    if (!error) {
      error = new Error(value + '');
    }
    throw error;
  }

  /**
   * `resolve(value?: any): Promise`
   *
   * Returns a promise that resolves the next time an event is issued.
   * If an argument is given it will passed to the promise, otherwise
   * the event object will be used as the resolved value.
   */
  public async resolve<U>(value: U): Promise<U>;
  /**
   * `resolve(value?: any): Promise`
   *
   * Returns a promise that resolves the next time an event is issued.
   * If an argument is given it will passed to the promise, otherwise
   * the event object will be used as the resolved value.
   */
  public async resolve(): Promise<T>;
  public async resolve(value?: object): Promise<object> {
    let hasValue = arguments.length === 1;
    return new Promise(resolve => {
      this.once(ev => {
        if (hasValue) {
          resolve(value);
        } else {
          resolve(ev);
        }
      });
    });
  }

  /**
   * Notifies the given listener the next time an event is issued, but not afterwards.
   */
  public once(listener: Listener<T>) {
    let callback = (ev: CustomEvent<T>) => {
      this.removeListener(callback);
      listener(ev);
    };
    this.addListener(callback);
  }

  /**
   * Registers a listener to be notified by new events. Each listener can only be added once.
   * Same as calling the `Listeners` instance as a function.
   */
  public addListener(listener: Listener<T>) {
    this.store.on(this.type, listener);
  }

  /**
   * De-registers a listener, it will not be notified by future events.
   */
  public removeListener(listener: Listener<T>) {
    this.store.off(this.type, listener);
  }

  /**
   * Issues an event to all registered listeners.
   *
   * May be given a plain object which values will be copied to the issued event object.
   * If an _uninitialized_ (not previously issued) instance of `EventObject` is given, it
   * will be issued directly. An initialized event object will be copied, enabling
   * simple event re-routing.
   */
  public trigger(eventData?: T) {
    let uninitialized = (eventData instanceof EventObject) && !eventData.type;
    let dispatchObject = uninitialized ? eventData : new EventObject();
    if (eventData && (eventData !== dispatchObject)) {
      let {type, target, timeStamp, ...copyData} = eventData as EventObject<object>;
      Object.assign(dispatchObject, copyData);
    }
    if ((dispatchObject as any)._initEvent instanceof Function) {
      (dispatchObject as any)._initEvent(this.type, this.target);
    }
    this.store.trigger(this.type, dispatchObject);
  }

}

interface UntypedListenerStore {
  on(type: string, listener: Listener<any>): any;
  off(type: string, listener: Listener<any>): any;
  trigger(type: string, value: any): any;
}

class DefaultListenerStore implements UntypedListenerStore {

  private listeners: Map<Listener<any>, boolean> = new Map();

  public on(type: string, listener: Listener<any>) {
    this.listeners.set(listener, true);
  }

  public off(type: string, listener: Listener<any>) {
    this.listeners.delete(listener);
  }

  public trigger(type: string, ev: any) {
    this.listeners.forEach((value, listener) => {
      let result = listener(ev);
      if (result instanceof Promise) {
        result.catch(console.error);
      }
    });
  }

}

export type CustomEvent<EventData, Target = {}> = EventObject<Target> & EventData;
export type ChangeEvent<Value, Target = {}> = PropertyChangedEvent<Target, Value>;
export type ChangeListener<Value, Target = {}> = Listener<ChangeEvent<Value, Target>>;
export type ChangeListeners<Value, Target = {}> = Listeners<ChangeEvent<Value, Target>>;

// Ensure @event can check the property type:
// tslint:disable-next-line:variable-name
export const ChangeListeners = Listeners;
