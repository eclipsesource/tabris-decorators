import { ChangeListeners } from 'tabris';
import { event, property } from 'tabris-decorators';

export class Person {

  @property public name: string;
  @property public age: number = 50;

  @event public onAgeChanged: ChangeListeners<Person, 'age'>;
  @event public onNameChanged: ChangeListeners<Person, 'name'>;

}
