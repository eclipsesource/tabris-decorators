import { EventObject, NativeObject, PropertyChangedEvent } from 'tabris';
import { Constructor } from '../index';

export type Listener<T = {}> = (ev: CustomEvent<T>) => any;

export interface Listeners<T extends object = {}> {
  // tslint:disable-next-line:callable-types
  (listener: Listener<CustomEvent<T>>): void;
}

const DELEGATE_FIELDS = ['reject', 'resolve', 'addListener', 'removeListener', 'once', 'trigger'];

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
    for (let key of DELEGATE_FIELDS) {
      delegate[key] = this[key] = this[key].bind(this);
    }
    return delegate;
  }

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

  public async resolve<U>(value: U): Promise<U>;
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

  public once(listener: Listener<T>) {
    let callback = (ev: CustomEvent<T>) => {
      this.removeListener(callback);
      listener(ev);
    };
    this.addListener(callback);
  }

  public addListener(listener: Listener<T>) {
    this.store.on(this.type, listener);
  }

  public removeListener(listener: Listener<T>) {
    this.store.off(this.type, listener);
  }

  public trigger(eventObject?: T) {
    let dispatchObject = eventObject instanceof EventObject ? eventObject : new EventObject();
    if (eventObject && (eventObject !== dispatchObject)) {
      let {type, target, timeStamp, ...eventData} = eventObject as EventObject<object>;
      Object.assign(dispatchObject, eventData);
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
export type ChangedEvent<Value, Target = {}> = PropertyChangedEvent<Target, Value>;
export type ChangeListener<Value, Target = {}> = Listener<ChangedEvent<Value, Target>>;
export type ChangeListeners<Value, Target = {}> = Listeners<ChangedEvent<Value, Target>>;

// Ensure @event can check the property type:
// tslint:disable-next-line:variable-name
export const ChangeListeners = Listeners;
