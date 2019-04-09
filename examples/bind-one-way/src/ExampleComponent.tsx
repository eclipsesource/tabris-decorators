import { Composite, ProgressBar, Properties, Stack, TextView } from 'tabris';
import { component, property } from 'tabris-decorators';

export class Model {
  public someString: string = 'Hello Again!';
  public someNumber: number = 50;
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

        <TextView>Simple binding to a string property:</TextView>
        <TextView bind-text='myText'/>

        <TextView>Exactly the same:</TextView>
        <TextView bind-text={{path: 'myText'}}/>

        <TextView>With a fallback value for undefined:</TextView>
        <TextView text='fallback text' bind-text='myText'/>

        <TextView>To the property of an object:</TextView>
        <TextView bind-text='myObject.someString'/>

        <TextView>With a fallback value for null or undefined:</TextView>
        <TextView text='fallback text' bind-text='myObject.someString'/>

        <TextView>Binding to a numeric value:</TextView>
        <ProgressBar bind-selection='myObject.someNumber' width={200}/>

        <TextView>Binding to a numeric value with fallback:</TextView>
        <ProgressBar selection={100} bind-selection='myObject.someNumber' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
