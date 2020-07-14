const {Button} = require('tabris');
const {connect} = require('tabris-decorators');
/* globals StateToProps, DispatchToProps */

exports.FunctionalComponent = connect(
  /** @type {StateToProps<Button>} */
  state => ({text: 'Random number: ' + state.num}),
  /** @type {DispatchToProps<Button>} */
  dispatch => ({onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
)(
  /** @param {tabris.Properties<Button>} properties */
  properties => new Button({font: '12px serif', textColor: 'black'}).set(properties)
);
