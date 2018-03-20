import { Injection, InjectionHandlerObject } from './Injector';
import { Constructor } from './utils';

export class DefaultInjectionHandler<T> implements InjectionHandlerObject<T> {

  private instance: T;

  constructor(private type: Constructor<T>, private config: InjectableConfig = {}) { }

  public handleInjection({injector}: Injection) {
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
