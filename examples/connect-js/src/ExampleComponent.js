const {Composite, ProgressBar, Stack, TextView} = require('tabris');
const {connect} = require('tabris-decorators');
/* globals RootState */

/**
 * @param {RootState} state
 * @returns {tabris.Properties<ExampleComponent>}
 */
const mapStateToProps = state => ({
  selection: state.num,
  text: state.str
});

class ExampleComponent extends Composite {

  /**
   * @param {tabris.Properties<ExampleComponent>=} properties
   */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      new Stack({spacing: 23, padding: 23}).append(

        new TextView({text: 'Binding to store value "num"'}),
        this._bar = new ProgressBar({width: 200}),

        new TextView({text: 'Binding to store value "str":'}),
        this._msg = new TextView({background: 'yellow'})

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

exports.ExampleComponent = connect(mapStateToProps)(ExampleComponent);
