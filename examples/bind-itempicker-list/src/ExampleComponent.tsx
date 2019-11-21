import { Composite, Properties, Stack, TextView } from 'tabris';
import { bind, component, ItemPicker, List, property, to } from 'tabris-decorators';
import { Person } from './Person';

@component
export class ExampleComponent extends Composite {

  @bind('#picker.selection') public details: Person = null;
  @property public persons: List<Person>;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} stretchX>
        <TextView stretchX>
          Binding a mutable List of mutable Items to ItemPicker.
        </TextView>
        <ItemPicker stretchX id='picker' textSource='name.given' bind-items='persons'/>
        <TextView bind-text='details.name'/>
        <TextView template-text='is ${details.age} years old'/>
      </Stack>
    )._find(TextView).set({font: {size: 18}});
  }

}
