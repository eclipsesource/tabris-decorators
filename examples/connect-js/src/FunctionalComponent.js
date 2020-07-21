const {Button, Set, Composite} = require('tabris');
const {connect} = require('tabris-decorators');
/* globals StateToProps, DispatchToProps */

/** @type {StateToProps<Composite>} */
const stateToProps = state => ({
  apply: {
    '#button': Set(Button, {text: 'Random number: ' + state.num})
  }
});

/** @type {DispatchToProps<Composite>} */
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
