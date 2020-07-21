import {Attributes, Button, Color, Composite, Set} from 'tabris';
import {connect} from 'tabris-decorators';

export const FunctionalComponent = connect(
  state => ({
    apply: {
      '#button': Set(Button, {text: 'Random number: ' + state.num})
    }
  }),
  dispatch => ({
    apply: {
      '#button': Set(Button, {onSelect: () => dispatch({type: 'SET_RANDOM_NUMBER'})})
    }
  })
)(
  (attributes: Attributes<Composite>) =>
    <Composite padding={12} {...attributes}>
      <Button id='button' font='12px serif' textColor={Color.black} background={Color.yellow}/>
    </Composite>
);
