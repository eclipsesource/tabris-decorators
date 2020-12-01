import {Composite, Stack, TextView, Apply} from 'tabris';
import {bind, component, ItemPicker, property} from 'tabris-decorators';
import {Person} from './Person';

@component
export class ExampleComponent extends Composite {

  /** @type {Person} */
  @bind({
    path: '#picker.selection',
    typeGuard: value => value === null || value instanceof Person
  }) details = null;

  /** @type {import('tabris-decorators').List<Person>} */
  @property persons;

  /** @param {tabris.Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} stretchX>
        <Apply target={TextView} attr={{font: {size: 21}}}/>
        <TextView stretchX>
          Binding a mutable List of mutable Items to ItemPicker.
        </TextView>
        <ItemPicker stretchX id='picker' textSource='name.given' bind-items='persons'/>
        <TextView bind-text='details.name'/>
        <TextView template-text='is ${details.age} years old'/>
      </Stack>
    );
  }

}
