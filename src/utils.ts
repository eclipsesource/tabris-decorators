export type DecoratorFactory = (widgetProto: any, property: string) => void;

export function applyPropertyDecorator(name: string, args: any[], factory: DecoratorFactory): DecoratorFactory | void {
  let impl = (widgetProto: any, property: string) => {
    try {
      factory(widgetProto, property);
    } catch (error) {
      throw new Error(`Could not apply decorator "${name}" to property "${property}": ${error.message}`);
    }
  };
  if (areStaticDecoratorArgs(args)) {
    impl(args[0], args[1]);
  } else {
    return impl;
  }
}

export function areStaticDecoratorArgs(args: any[]): boolean {
  return typeof args[0] === 'object';
}

/**
 * Defines the a getter on the given prototype. If the prototype already has a getter or setter of that name the
 * function throws.
 */
export function defineGetter(proto: any, property: string, get: () => any): void {
  if (Object.getOwnPropertyDescriptor(proto, property)) {
    throw new Error('A getter or setter was already defined.');
  }
  Object.defineProperty(proto, property, {
    get,
    enumerable: true,
    configurable: true
  });
}

/**
 * Gets the type of the property. If the type can not be represented properly at runtime this will return null
 * instead of the object constructor.
 */
export function getPropertyType(proto: any, property: string): any {
  let result = Reflect.getMetadata('design:type', proto, property);
  return result === Object ? null : result;
}
