import { Composite, ProgressBar, Properties, Stack, TextView } from 'tabris';
import { component, property } from 'tabris-decorators';

export class OtherModel {
  @property public someString: string = 'Hello World';
}

export class Model {
  @property public otherModel: OtherModel = new OtherModel();
  @property public someNumber: number = 10;
}

@component
export class ExampleComponent extends Composite {

  @property public myText: string;
  @property public myObject: Model;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} >

        <TextView>Binding to a component property:</TextView>
        <TextView background='yellow'
            bind-text='myText'
            text='Placeholder'/>

        <TextView>Binding to a object property:</TextView>
        <ProgressBar bind-selection='myObject.someNumber' width={200}/>

        <TextView>Binding to a nested object property:</TextView>
        <TextView background='yellow'
            bind-text='myObject.otherModel.someString'
            text='Placeholder'/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
