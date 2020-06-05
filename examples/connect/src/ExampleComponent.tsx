import {Composite, ProgressBar, Properties, Stack, TextView} from 'tabris';
import {connect, prop} from 'tabris-decorators';

@connect(state => ({
  selection: state.num,
  text: state.str
}))
export class ExampleComponent extends Composite {

  @prop selection: number;
  @prop text: string;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Binding to store value "num"</TextView>
        <ProgressBar bind-selection='selection' width={200}/>

        <TextView>Binding to store value "str":</TextView>
        <TextView background='yellow' bind-text='text'/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
