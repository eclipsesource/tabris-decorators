import {AllBindings, bind, BindAllDecorator} from './bind';

/**
 * A decorator for instance properties of classes extending `Composite`, i.e. a custom component.
 * It creates a two-way binding between properties of a model (e.g. an object using `@property`)
 * and children (descendants) of the component. Example:
 *
 *  ```ts
 * ‍@bindAll({
 *  modelPropA: '#childId1.text'
 *  modelPropB: '#childId2.selection'
 * })
 * myProp: MyModel;
 *
 * ```
 * *Notes:*
 * * *`@bindAll` behaves like `@property` in most regards.*
 * * *`@bindAll(bindings)` is a shorthand for `@bind({all: bindings})`. The latter
 * also supports the `typeGuard` and `type` options.*
 * * *Use`@bind(path)` or `@bind({path: path})` to create bindings to the component property itself.*
 */
export function bindAll<ValidKeys extends string>(bindings: AllBindings<ValidKeys>): BindAllDecorator<ValidKeys> {
  return bind({all: bindings});
}
