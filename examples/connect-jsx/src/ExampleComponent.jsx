import {Composite, Properties, Stack, TextView, CheckBox} from 'tabris';
import {connect, prop, event} from 'tabris-decorators';
/* globals StateToProps, DispatchToProps */

/** @type {StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  text: state.str
});

/** @type {DispatchToProps<ExampleComponent>} */
const dispatchToProps = dispatch => ({
  onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
});

@connect(stateToProps, dispatchToProps)
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
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Binding to store value "str":</TextView>
        <TextView background='yellow' bind-text='text'/>

        <CheckBox top={24} font={{size: 24}} onSelect={this.onToggle.trigger}>
          Toggle Message
        </CheckBox>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
