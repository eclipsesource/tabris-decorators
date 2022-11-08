import {Composite, Stack, TextView, CheckBox} from 'tabris';
import {connect, prop, event, component} from 'tabris-decorators';

/** @type {import('tabris-decorators').StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  text: state.myString
});

/** @type {import('tabris-decorators').DispatchToProps<ExampleComponent>} */
const dispatchToProps = dispatch => ({
  onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
});

@component @connect(stateToProps, dispatchToProps)
export class ExampleComponent extends Composite {

  /** @type {string} */
  @prop(String) text;

  /** @type {tabris.Listeners<tabris.CheckBoxSelectEvent>} */
  @event onToggle;

  /**
   * @param {tabris.Properties<ExampleComponent>} properties
   */
  constructor(properties) {
    super();
    this.append(
      <Stack spacing={12} padding={12}>
        <TextView font='18px'>Binding to store value "str":</TextView>
        <TextView font='18px' background='yellow' bind-text='text'/>
        <CheckBox top={24} font={{size: 24}} onSelect={this.onToggle.trigger}>
          Toggle Message
        </CheckBox>
      </Stack>
    ).set(properties);
  }

}
