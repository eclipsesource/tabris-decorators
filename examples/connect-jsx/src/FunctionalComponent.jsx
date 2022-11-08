/* eslint-disable @typescript-eslint/naming-convention */
import {Button, Composite, Set} from 'tabris';
import {connect} from 'tabris-decorators';

export const FunctionalComponent = connect(
  state => ({
    apply: {
      '#button': Set(Button, {text: 'Random number: ' + state.myNumber})
    }
  }),
  dispatch => ({
    apply: {
      '#button': Set(Button, {onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
    }
  })
)(
  /** @param {tabris.Attributes<Composite>} attributes */
  attributes =>
    <Composite padding={12} {...attributes}>
      <Button id='button' font='12px serif' textColor='black' background='yellow'/>
    </Composite>
);
