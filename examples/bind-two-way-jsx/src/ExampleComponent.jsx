import {Composite, Properties, Slider, Stack, TextInput, TextView} from 'tabris';
import {bind, component} from 'tabris-decorators';

@component
export class ExampleComponent extends Composite {

  /** @type {number} */
  @bind({
    path: '#source1.selection'
  })
  myNumber = 50;

  /** @type {string} */
  @bind({
    path: '#source2.text'
  })
  myText = 'Hello World!';

  /** @param {Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Source of "myNumber":</TextView>
        <Slider id='source1' width={200}/>

        <TextView>Source of "myText":</TextView>
        <TextInput id='source2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
