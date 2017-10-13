import {instance as injectionManager} from './InjectionManager';
import {Constructor, applyClassDecorator, ClassDecoratorFactory, areStaticClassDecoratorArgs} from './utils';

export default function injectable(shared: boolean): ClassDecoratorFactory;
export default function injectable(type: Constructor<any>): void;
export default function injectable(...args: any[]): ClassDecoratorFactory | void {
  return applyClassDecorator('injectable', args, (type: Constructor<any>) => {
    let injectionHandler = getShared(args) ? createSharedInjectionHandler(type) : createDefaultInjectionHandler(type);
    injectionManager.addHandler(type, injectionHandler);
  });
}

function getShared(args: any[]) {
  if (!areStaticClassDecoratorArgs(args)) {
    return args[0] as boolean;
  }
  return false;
}

function createSharedInjectionHandler<T>(type: Constructor<T>) {
  let instance: T;
  return () => {
    if (instance === undefined) {
      instance = injectionManager.create(type);
    }
    return instance;
  };
}

function createDefaultInjectionHandler(type: Constructor<any>) {
  return () => injectionManager.create(type);
}
