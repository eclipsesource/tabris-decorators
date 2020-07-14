import {Attributes, Button} from 'tabris';
import {connect} from 'tabris-decorators';

export const FunctionalComponent = connect<Button>(
  state => ({
    text: 'Random number: ' + state.num
  }),
  dispatch => ({
    onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})
  })
)(
  (attributes: Attributes<Button>) => <Button font='12px serif' textColor='black' {...attributes}/>
);
