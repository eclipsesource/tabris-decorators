import {ColorValue, Composite, FontValue, Properties, Stack} from 'tabris';
import {bind, component, property} from 'tabris-decorators';
import {isState, State, TriStateButton} from './TriStateButton';

@component
export class Survey extends Composite {

  /** @type {State} */
  @bind({path: '#pizza.state', typeGuard: isState})
  pizza;

  /** @type {State} */
  @bind({path: '#milk.state', typeGuard: isState})
  milk;

  /** @type {State} */
  @bind({path: '#apples.state', typeGuard: isState})
  apples;

  /** @type {FontValue} */
  @property font;

  /** @type {ColorValue} */
  @property textColor;

  /** @param {Properties<Survey>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack padding={12} spacing={12}>
        <TriStateButton id='pizza'
            bind-font='font'
            bind-textColor='textColor'
            text='Do you like pizza?'/>
        <TriStateButton id='milk'
            bind-font='font'
            bind-textColor='textColor'
            text='Do you like milk?'/>
        <TriStateButton id='apples'
            bind-font='font'
            bind-textColor='textColor'
            text='Do you like apples?'/>
      </Stack>
    );
  }

}
