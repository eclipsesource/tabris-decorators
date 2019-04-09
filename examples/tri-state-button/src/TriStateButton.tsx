import { Color, ColorValue, Composite, Font, FontValue, LayoutData, Properties, TextView } from 'tabris';
import { component, property, to } from 'tabris-decorators';

export type State = 'empty' | 'checked' | 'crossed';

export function isState(value: unknown): value is State {
  return value === 'empty' || value === 'checked' || value === 'crossed';
}

@component
export class TriStateButton extends Composite {

  @property(isState) public state: State = 'empty';
  @property(Color.isColorValue) public textColor: ColorValue = 'black';
  @property(Font.isFontValue) public font: FontValue = 'initial';
  @property public text: string = '';

  constructor(properties: Properties<TriStateButton>) {
    super();
    this.set(properties);
    this.onTap(this.handleTap);
    this.append(
      <$>
        <TextView centerY font={{size: 24}} bind-text={to('state', state => stateToChar[state])}/>
        <TextView centerY left={[LayoutData.prev, 8]}
            bind-text='text'
            bind-font='font'
            bind-textColor='textColor'/>
      </$>
    );
  }

  private handleTap = () => {
    if (this.state === 'checked') {
      this.state = 'crossed';
    } else if (this.state === 'crossed') {
      this.state = 'empty';
    } else {
      this.state = 'checked';
    }
  }

}

const stateToChar: Record<State, string> = {
  empty: '☐',
  checked: '☑',
  crossed: '☒'
};
