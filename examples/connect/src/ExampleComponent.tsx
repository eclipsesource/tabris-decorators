import {CheckBox, CheckBoxSelectEvent, Composite, Listeners, Properties, Stack, TextView} from 'tabris';
import {component, connect, event, prop} from 'tabris-decorators';

@component
@connect<ExampleComponent>(
  state => ({
    text: state.myString
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
    this.append(
      <Stack spacing={12} padding={12}>
        <TextView font='18px'>Binding to store value "str":</TextView>
        <TextView font='18px' background='yellow' bind-text='text'/>
        <CheckBox top={24} font={{size: 24}} onSelect={this.onToggle.trigger}>
          Toggle Message
        </CheckBox>
      </Stack>
    );
    this.set(properties);
  }

}
