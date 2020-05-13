import {Composite, Properties, Slider, Stack, TextInput, TextView} from 'tabris';
import {bindAll, component, prop} from 'tabris-decorators';

export class Model {

  /** @type {string} */
  @prop(String) myText;

  /** @type {number} */
  @prop(Number) myNumber;

}

@component
export class ExampleComponent extends Composite {

  /** @type {Model} */
  @bindAll({
    myText: '#input1.text',
    myNumber: '#input2.selection'
  })
  model;

  /** @param {Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Bound to "myText"</TextView>
        <TextInput id='input1' width={200} text='Fallback Text'/>

        <TextView>Bound to "myNumber"</TextView>
        <Slider id='input2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
