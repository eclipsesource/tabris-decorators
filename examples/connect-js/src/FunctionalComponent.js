/* eslint-disable @typescript-eslint/naming-convention */
const {Button, Set, Composite} = require('tabris');
const {connect} = require('tabris-decorators');

/** @type {import('tabris-decorators').StateToProps<tabris.Composite>} */
const stateToProps = state => ({
  apply: {
    '#button': Set(Button, {text: 'Random number: ' + state.myNumber})
  }
});

/** @type {import('tabris-decorators').DispatchToProps<tabris.Composite>} */
const dispatchToProps = dispatch => ({
  apply: {
    '#button': Set(Button, {onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
  }
});

exports.FunctionalComponent = connect(stateToProps, dispatchToProps)(
  /** @param {tabris.Attributes<tabris.Composite>} attr */
  attr => Composite({padding: 12, ...attr, children: [
    Button({font: '12px serif', id: 'button', textColor: 'black', background: 'yellow'})
  ]})
);
