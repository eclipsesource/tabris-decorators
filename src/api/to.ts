import {Binding, BindingConverter} from '../internals/utils-databinding';

/**
 * Allows assigning a converter function to a one way binding:
 *
 *    <textView
 *       bind-text={to('person.dob', v => v.toLocaleString())} />
 *
 * This is the same as:
 *
 *    <textView
 *       bind-text={{path: 'person.dob', converter: v => v.toLocaleString())} />
 *
 *  Can also be used to create reuseable shorthands:
 *
 *     const toLocaleString
 *       = (path: string) => to(path, v => v.toLocaleString());
 *
 *     <textView bind-text={toLocaleString('person.dob')} />
 *
 * The converter function may have a second parameter which is
 * passed a `Conversion` object that identifies the target of the conversion.
 */
export function to(path: string, converter: BindingConverter): Binding {
  return {path, converter};
}
