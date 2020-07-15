import {CheckBox, CheckBoxSelectEvent, Composite, Listeners, Properties, Stack, TextView} from 'tabris';
import {connect, event, prop} from 'tabris-decorators';
import {component} from 'tabris-decorators';

@component
@connect<ExampleComponent>(
  state => ({
    text: state.str
  }),
  dispatch => ({
    onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
  })
)
export class ExampleComponent extends Composite {

  @prop text: string;
  @event onToggle: Listeners<CheckBoxSelectEvent>;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView font='18px'>Binding to store value "str":</TextView>
        <TextView font='18px' background='yellow' bind-text='text'/>

        <CheckBox top={24} font={{size: 24}} onSelect={this.onToggle.trigger}>
          Toggle Message
        </CheckBox>

      </Stack>
    );
  }

}
