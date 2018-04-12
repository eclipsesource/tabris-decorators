import { Composite } from 'tabris';
import { createBoundProperty } from '../internals/bind-two-way';
import { applyDecorator, TypeGuard, WidgetInterface } from '../internals/utils';

/**
 * A decorator for instance properties on classes extending `Widget`.
 *
 * Creates a two-way binding between the decorated property and the property given via the path parameter:
 *
 *  ```
 * ‍@bind(path: "#childId.property")
 * public baseProperty: SomeType = initialValue;
 * ```
 *
 * The binding is established after `append` is called the first time on the base widget.
 *
 * Like `@property` it supports type guards, which are required for some advanced types.
 * They can be attached like this:
 *
 *  ```
 * ‍@bind({path: myPath, typeGuard: typeCheckFunction})
 * public baseProperty: SomeType = initialValue;
 * ```
 *
 * `@bind` only works on classes decorated with `@component`.
 */
export function bind(arg: BindConfig | string): (target: Composite, property: string) => void;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const targetPath = typeof args[0] === 'string' ? args[0] : args[0].path;
    const typeGuard = typeof args[0] === 'string' ? undefined : args[0].typeGuard;
    createBoundProperty(baseProto, baseProperty, targetPath, typeGuard);
  });
}

export interface BindConfig {
  path: string;
  typeGuard: TypeGuard;
}
