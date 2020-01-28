import { ChangeListeners } from 'tabris';
import { event, property } from 'tabris-decorators';

export class Person {

  /** @type {string} */
  @property name;

  /** @type {number} */
  @property age = 50;

  /** @type {ChangeListeners<Person, 'age'>} */
  @event onAgeChanged;

  /** @type {ChangeListeners<Person, 'name'>} */
  @event onNameChanged;

}
