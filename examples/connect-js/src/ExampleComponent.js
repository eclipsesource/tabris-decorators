const {Composite, ProgressBar, Stack, TextView, CheckBox, Listeners} = require('tabris');
const {connect} = require('tabris-decorators');
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

class ExampleComponent extends Composite {

  /**
   * @param {tabris.Properties<ExampleComponent>=} properties
   */
  constructor(properties) {
    super();
    this.set(properties);

    /** @type {tabris.Listeners<tabris.CheckBoxSelectEvent<ExampleComponent>>} */
    this.onToggle = new Listeners(this, 'toggle');

    this.append(
      new Stack({spacing: 23, padding: 23}).append(

        new TextView({text: 'Binding to store value "num"'}),
        this._bar = new ProgressBar({width: 200}),

        new TextView({text: 'Binding to store value "str":'}),
        this._msg = new TextView({background: 'yellow'}),

        new CheckBox({top: 24, font: {size: 24}, text: 'Toggle Store Values'})
          .onSelect(this.onToggle.trigger)

      )
    );
    this._find(TextView).set({font: {size: 18}});
  }

  set selection(value) {
    this._bar.selection = value;
  }

  get selection() {
    return this._bar.selection;
  }

  set text(value) {
    this._msg.text = value;
  }

  get text() {
    return this._msg.text;
  }

}

exports.ExampleComponent = connect(stateToProps, dispatchToProps)(ExampleComponent);
