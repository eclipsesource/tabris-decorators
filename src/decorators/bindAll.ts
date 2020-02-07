import {AllBindings, bind, BindAllDecorator} from './bind';

/**
 * A shorthand for `bind({all: bindings})`
 *
 * Example:
 *
 * ```
 * ‍@bindAll({
 *  someTypePropertyA: '#childId1.property'
 *  someTypePropertyB: '#childId2.property'
 * })
 * componentProperty: SomeType = initialValue;
 * ```
 */
export function bindAll<ValidKeys extends string>(bindings: AllBindings<ValidKeys>): BindAllDecorator<ValidKeys> {
  return bind({all: bindings});
}
