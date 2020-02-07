import {event, property} from 'tabris-decorators';

export class Person {

  /** @type {string} */
  @property name;

  /** @type {number} */
  @property age = 50;

  /** @type {import('tabris').ChangeListeners<Person, 'age'>} */
  @event onAgeChanged;

  /** @type {import('tabris').ChangeListeners<Person, 'name'>} */
  @event onNameChanged;

}
