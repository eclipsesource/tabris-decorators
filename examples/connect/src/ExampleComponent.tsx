import {CheckBox, CheckBoxSelectEvent, Composite, Listeners, ProgressBar, Properties, Stack, TextView} from 'tabris';
import {connect, event, prop} from 'tabris-decorators';

@connect<ExampleComponent>(
  state => ({
    selection: state.num,
    text: state.str
  }),
  dispatch => ({
    onToggle: ev => dispatch({type: 'TOGGLE_VALUES', checked: ev.checked})
  })
)
export class ExampleComponent extends Composite {

  @prop selection: number;
  @prop text: string;
  @event onToggle: Listeners<CheckBoxSelectEvent>;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Binding to store value "num"</TextView>
        <ProgressBar bind-selection='selection' width={200}/>

        <TextView>Binding to store value "str":</TextView>
        <TextView background='yellow' bind-text='text'/>

        <CheckBox top={24} font={{size: 24}} onSelect={this.onToggle.trigger}>
          Toggle Store Values
        </CheckBox>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
