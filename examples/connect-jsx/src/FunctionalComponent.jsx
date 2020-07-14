import {Button} from 'tabris';
import {connect} from 'tabris-decorators';
/* globals StateToProps, DispatchToProps */

export const FunctionalComponent = connect(
  /** @type {StateToProps<Button>} */
  state => ({text: 'Random number: ' + state.num}),
  /** @type {DispatchToProps<Button>} */
  dispatch => ({onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
)(
  /** @param {tabris.Attributes<Button>} attributes */
  attributes => <Button font='12px serif' textColor='black' {...attributes}/>
);
