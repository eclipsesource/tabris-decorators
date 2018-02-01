import { instance as injector, InjectionHandler, Injection } from './Injector';
import { Constructor } from './utils';

export default class DefaultInjectionHandler<T> implements InjectionHandler<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private config: InjectableConfig = {}) { }

  public handleInjection(injection: Injection) {
    if (!this.config.shared) {
      return injector.create(this.type);
    }
    if (!this.instance) {
      this.instance = injector.create(this.type);
    }
    return this.instance;
  }

}

export interface InjectableConfig {
  shared?: boolean;
}
