import { ChangeListeners, Composite, Properties, Slider, Stack, TextInput, TextView } from 'tabris';
import { bind, bindAll, component, event, property } from 'tabris-decorators';

export class Model {
  @event public onMyTextChanged: ChangeListeners<Model, 'myText'>;
  @property public myText: string;
}

@component
export class ExampleComponent extends Composite {

  @bind('#source1.selection') public myNumber: number;
  @event public onMyNumberChanged: ChangeListeners<ExampleComponent, 'myNumber'>;

  @bindAll({myText: '#source2.text'})
  public model: Model;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} >

        <TextView>Source of "myNumber":</TextView>
        <Slider id='source1' width={200}/>

        <TextView>Source of "model.myText":</TextView>
        <TextInput id='source2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
