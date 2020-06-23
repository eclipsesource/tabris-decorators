import {Composite, ProgressBar, Properties, Stack, TextView, CheckBox} from 'tabris';
import {connect, prop, event} from 'tabris-decorators';
/* globals StateToProps, DispatchToProps */

/** @type {StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  selection: state.num,
  text: state.str
});

/** @type {DispatchToProps<ExampleComponent>} */
const dispatchToProps = dispatch => ({
  onToggle: ev => dispatch(({type: 'TOGGLE_VALUES', checked: ev.checked}))
});

@connect(stateToProps, dispatchToProps)
export class ExampleComponent extends Composite {

  /** @type {number} */
  @prop(Number) selection;

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
