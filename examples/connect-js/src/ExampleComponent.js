const {Composite, Stack, TextView, CheckBox, Listeners, asFactory, WidgetCollection} = require('tabris');
const {connect} = require('tabris-decorators');
/* globals StateToProps, DispatchToProps */

/** @returns {tabris.WidgetCollection<any>} */
const hideChildren = () => new WidgetCollection([]);

class ExampleComponent extends Composite {

  /** @param {tabris.Properties<ExampleComponent>=} properties */
  constructor(properties) {
    super();
    /** @type {tabris.Listeners<tabris.CheckBoxSelectEvent<ExampleComponent>>} */
    this.onToggle = new Listeners(this, 'toggle');
    this.set(properties).append(this._createContent());
    this.children = hideChildren;
  }

  set text(value) {
    this._find('#message').only(TextView).text = value;
  }

  get text() {
    return this._find('#message').only(TextView).text;
  }

  _createContent() {
    return Stack({spacing: 23, padding: 23, children: [
      TextView({font: '18px', text: 'Binding to store value "str":'}),
      TextView({font: '18px', id: 'message', background: 'yellow'}),
      CheckBox({
        top: 24, font: {size: 24}, text: 'Toggle Message',
        onSelect: this.onToggle.trigger
      })
    ]});
  }

}

/** @type {StateToProps<ExampleComponent>} */
const stateToProps = state => ({
  text: state.myString
});

/** @type {DispatchToProps<ExampleComponent>} */
const dispatchToProps = dispatch => ({
  onToggle: ev => dispatch({type: 'TOGGLE_STRING', checked: ev.checked})
});

const connector = connect(stateToProps, dispatchToProps);
exports.ExampleComponent = connector(asFactory(ExampleComponent));
