import {Color, Composite, Font, LayoutData, Properties, TextView} from 'tabris';
import {component, property, to} from 'tabris-decorators';

/**
 * @typedef State
 * @type {boolean | 'neutral'}
 */

/**
 * @param {any} value
 * @returns {boolean}
 */
export function isState(value) {
  return value === true || value === false || value === 'neutral';
}

@component
export class TriStateButton extends Composite {

  /** @type {State} */
  @property(isState) state = false;

  /** @type {tabris.ColorValue} */
  @property(Color.isColorValue) textColor = 'black';

  /** @type {tabris.FontValue} */
  @property(Font.isFontValue) font = 'initial';

  /** @type {string} */
  @property text = '';

  /** @param {Properties<TriStateButton>} properties */
  constructor(properties) {
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

  handleTap = () => {
    if (this.state === true) {
      this.state = false;
    } else if (this.state === false) {
      this.state = 'neutral';
    } else {
      this.state = true;
    }
  };

}

/**
 * @param {State} state
 * @returns {string}
 */
function stateToChar(state) {
  if (state === 'neutral') {
    return '☐';
  } else if (state === true) {
    return '☑';
  }
  return '☒';
}
