const {Button} = require('tabris');
const {connect} = require('tabris-decorators');
/* globals StateToProps, DispatchToProps */

exports.FunctionalComponent = connect(
  /** @type {StateToProps<tabris.Button>} */
  state => ({text: 'Random number: ' + state.num}),
  /** @type {DispatchToProps<tabris.Button>} */
  dispatch => ({onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
)(
  /** @param {tabris.Attributes<tabris.Button>} attr */
  attr => Button({font: '12px serif', textColor: 'black', ...attr})
);
