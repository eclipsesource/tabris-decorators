import {Composite, Properties, Stack, TextView, CheckBox} from 'tabris';
import {connect, prop, event, component} from 'tabris-decorators';
/* globals StateToProps, DispatchToProps */

/** @type {StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  text: state.str
});

/** @type {DispatchToProps<ExampleComponent>} */
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
   * @param {Properties<ExampleComponent>} properties
   */
  constructor(properties) {
    super();
    this.set(properties).append(
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
