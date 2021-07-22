import {event, property} from 'tabris-decorators';

export class Name {

  /** @type {string} */
  @property firstName;

  /** @type {string} */
  @property lastName;

  toString() {
    return this.firstName + ' ' + this.lastName;
  }

}

export class Person {

  /** @type {Name} */
  @property({observe: true}) name = new Name();

  /** @type {number} */
  @property age = 50;

  /** @type {tabris.ChangeListeners<Person, 'age'>} */
  @event onAgeChanged;

  /** @type {tabris.ChangeListeners<Person, 'name'>} */
  @event onNameChanged;

}
