import { ChangeListeners, Composite, Properties, Slider, Stack, TextInput, TextView } from 'tabris';
import { bind, component, event } from 'tabris-decorators';

@component
export class ExampleComponent extends Composite {

  @bind('#source1.selection') public myNumber: number = 50;
  @event public onMyNumberChanged: ChangeListeners<ExampleComponent, 'myNumber'>;

  @bind('#source2.text') public myText: string = 'Hello World!';
  @event public onMyTextChanged: ChangeListeners<ExampleComponent, 'myText'>;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} >

        <TextView>Source of "myNumber":</TextView>
        <Slider id='source1' width={200}/>

        <TextView>Source of "myText":</TextView>
        <TextInput id='source2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
