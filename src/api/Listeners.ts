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
    delegate.addListener = this.addListener = this.addListener.bind(this);
    delegate.removeListener = this.removeListener = this.removeListener.bind(this);
    delegate.trigger = this.trigger = this.trigger.bind(this);
    delegate.resolve = this.resolve = this.resolve.bind(this);
    delegate.reject = this.reject = this.reject.bind(this);
    return delegate;
  }

  public reject = async <U>(value?: U): Promise<never> => {
    await this.resolve();
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

  public async resolve<U>(value: U): Promise<U>;
  public async resolve(): Promise<T>;
  public async resolve(value?: object): Promise<object> {
    return new Promise(resolve => {
      let callback = (ev: CustomEvent<T>) => {
        this.removeListener(callback);
        if (value) {
          resolve(value);
        } else {
          resolve(ev);
        }
      };
      this.addListener(callback);
    });
  }

  public addListener(listener: Listener<T>) {
    this.store.on(this.type, listener);
  }

  public removeListener(listener: Listener<T>) {
    this.store.off(this.type, listener);
  }

  public trigger(eventObject?: T) {
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
