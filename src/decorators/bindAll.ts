import {MultipleBindings} from '../internals/utils-databinding';
import {bind} from './bind';
import {CustomPropertyDecorator} from './property';

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
 * * *In addition to id selectors, type selectors and `:host` are also supported.* *
 * * *Use`@bind(path)` or `@bind({path: path})` to create bindings to the property itself.*
 */
export function bindAll<T>(bindings: MultipleBindings<T>): CustomPropertyDecorator<T> {
  return bind({all: bindings});
}
