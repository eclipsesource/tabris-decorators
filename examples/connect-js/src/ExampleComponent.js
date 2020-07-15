const {Composite, Stack, TextView, CheckBox, Listeners} = require('tabris');
const {connect, component} = require('tabris-decorators');
/* globals StateToProps, DispatchToProps */

/** @type {StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  text: state.str
});

/** @type {DispatchToProps<ExampleComponent>} */
const dispatchToProps = dispatch => ({
  onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
});

const ExampleComponent = component(class ExampleComponent extends Composite {

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

        new TextView({font: '18px', text: 'Binding to store value "str":'}),
        this._msg = new TextView({font: '18px', background: 'yellow'}),

        new CheckBox({top: 24, font: {size: 24}, text: 'Toggle Message'})
          .onSelect(this.onToggle.trigger)

      )
    );
  }

  set text(value) {
    this._msg.text = value;
  }

  get text() {
    return this._msg.text;
  }

});

exports.ExampleComponent = connect(stateToProps, dispatchToProps)(ExampleComponent);
