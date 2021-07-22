import {ChangeListeners} from 'tabris';
import {event, property} from 'tabris-decorators';

export class Name {

  @property firstName: string;
  @property lastName: string;

  toString() {
    return this.firstName + ' ' + this.lastName;
  }

}

export class Person {

  @property age: number = 50;
  @property({observe: true}) name: Name = new Name();

  @event onAgeChanged: ChangeListeners<Person, 'age'>;
  @event onNameChanged: ChangeListeners<Person, 'name'>;

}
