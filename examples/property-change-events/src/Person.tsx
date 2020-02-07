import {ChangeListeners} from 'tabris';
import {event, property} from 'tabris-decorators';

export class Person {

  @property name: string;
  @property age: number = 50;

  @event onAgeChanged: ChangeListeners<Person, 'age'>;
  @event onNameChanged: ChangeListeners<Person, 'name'>;

}
