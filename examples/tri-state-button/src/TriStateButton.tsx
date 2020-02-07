import {Color, ColorValue, Composite, Font, FontValue, LayoutData, Properties, TextView} from 'tabris';
import {component, property, to} from 'tabris-decorators';

export type State = boolean | 'neutral';

export function isState(value: unknown): value is State {
  return value === true || value === false || value === 'neutral';
}

@component
export class TriStateButton extends Composite {

  @property(isState) state: State = false;
  @property(Color.isColorValue) textColor: ColorValue = 'black';
  @property(Font.isFontValue) font: FontValue = 'initial';
  @property text: string = '';

  constructor(properties: Properties<TriStateButton>) {
    super();
    this.set(properties);
    this.onTap(this.handleTap);
    this.append(
      <$>
        <TextView centerY font={{size: 24}} bind-text={to('state', stateToChar)}/>
        <TextView centerY left={[LayoutData.prev, 8]}
            bind-text='text'
            bind-font='font'
            bind-textColor='textColor'/>
      </$>
    );
  }

  private handleTap = () => {
    if (this.state === true) {
      this.state = false;
    } else if (this.state === false) {
      this.state = 'neutral';
    } else {
      this.state = true;
    }
  };

}

function stateToChar(state: State) {
  if (state === 'neutral') {
    return '☐';
  } else if (state === true) {
    return '☑';
  }
  return '☒';
}
