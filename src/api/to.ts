export interface Binding {
  path: string;
  converter?: (val: any) => any;
}

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
 */
export function to(path: string, converter: (val: any) => any): Binding {
  return {path, converter};
}
