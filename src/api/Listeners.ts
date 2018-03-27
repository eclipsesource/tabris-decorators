import { EventObject, NativeObject, PropertyChangedEvent, Widget } from 'tabris';

export type Listener<T> = (ev: CustomEvent<T>) => object | void;

export interface Listeners<T extends object = {}> {
  // tslint:disable-next-line:callable-types
  (listener: Listener<CustomEvent<T>>): void;
}

export class Listeners<T extends object = {}> {

  private store: UntypedListenerStore;
  private type: string;

  constructor(name?: string, widget?: NativeObject) {
    this.store = widget || new DefaultListenerStore();
    this.type = name || 'event';
    let delegate: Listeners<T> = this.addListener.bind(this);
    delegate.addListener = this.addListener;
    delegate.removeListener = this.removeListener;
    delegate.trigger = this.trigger;
    delegate.promise = this.promise;
    delegate.resolve = this.resolve;
    delegate.reject = this.reject;
    return delegate;
  }

  public resolve = async <U>(value: U): Promise<U> => {
    await this.promise();
    return Promise.resolve(value);
  }

  public reject = async <U>(value?: U): Promise<never> => {
    await this.promise();
    let error: Error | null = null;
    if (value instanceof Error) {
      error = value;
    }
    if (!error && value instanceof Function && value.prototype instanceof Error) {
      try {
        error = new (value as any)();
      } catch { /* that's OK, try something else */ }
    }
    if (!error && value !== undefined) {
      error = new Error(value + '');
    }
    if (!error) {
      error = new Error(`${this.type} fired`);
    }
    throw error;
  }

  public promise = async (): Promise<T> => {
    // TODO: Must all promises resolve eventually for GC to work?
    // V8 seems fine, what about JavaScriptCore?
    return new Promise<T>(resolve => {
      let callback = (ev: T) => {
        this.removeListener(callback);
        resolve(ev);
      };
      this.addListener(callback);
    });
  }

  public addListener = (listener: Listener<T>) => {
    this.store.on(this.type, listener);
  }

  public removeListener = (listener: Listener<T>) => {
    this.store.off(this.type, listener);
  }

  public trigger = (eventObject?: T) => {
    let dispatchObject = new EventObject() as Partial<CustomEvent<T>>;
    if (eventObject) {
      for (let key in eventObject) {
        if (key in dispatchObject) { continue; }
        dispatchObject[key] = eventObject[key];
      }
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

export type CustomEvent<T> = EventObject<object> & T;
export type ChangedEvent<T> = PropertyChangedEvent<Widget, T>;
export type ChangeListener<T> = Listener<ChangedEvent<T>>;
export type ChangeListeners<T> = Listeners<ChangedEvent<T>>;

// Ensure @event can check the property type:
// tslint:disable-next-line:variable-name
export const ChangeListeners = Listeners;
