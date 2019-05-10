import { ColorValue, Composite, FontValue, Properties, Stack } from 'tabris';
import { bind, component, property } from 'tabris-decorators';
import { isState, State, TriStateButton } from './TriStateButton';

@component
export class Survey extends Composite {

  @bind({path: '#pizza.state', typeGuard: isState})
  public pizza: State;

  @bind({path: '#milk.state', typeGuard: isState})
  public milk: State;

  @bind({path: '#apples.state', typeGuard: isState})
  public apples: State;

  @property public font: FontValue;
  @property public textColor: ColorValue;

  constructor(properties: Properties<Survey>) {
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
