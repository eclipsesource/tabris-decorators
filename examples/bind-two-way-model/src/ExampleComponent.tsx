import {Composite, Properties, Slider, Stack, TextInput, TextView, Color} from 'tabris';
import {bindAll, component, property} from 'tabris-decorators';

export class Model {
  @property myText: string;
  @property myNumber: number;
  @property myColor: Color;
}

@component
export class ExampleComponent extends Composite {

  @bindAll({
    myText: '#label.text',
    myNumber: 'Slider.selection',
    myColor: ':host.background'
  })
  model: Model;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Bound to "myText"</TextView>
        <TextInput id='label' width={200} text='Fallback Text'/>

        <TextView>Bound to "myNumber"</TextView>
        <Slider width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
