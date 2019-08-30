import { Composite, Properties, Slider, Stack, TextInput, TextView } from 'tabris';
import { bindAll, component, property } from 'tabris-decorators';

export class Model {
  @property public myText: string;
  @property public myNumber: number;
}

@component
export class ExampleComponent extends Composite {

  @bindAll({
    myText: '#input1.text',
    myNumber: '#input2.selection'
  })
  public model: Model;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} >

        <TextView>Bound to "myText"</TextView>
        <TextInput id='input1' width={200} text='Fallback Text'/>

        <TextView>Bound to "myNumber"</TextView>
        <Slider id='input2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
