import {Composite, Properties, TextInput, TextView} from 'tabris';
import {bind, component, event, property} from 'tabris-decorators';

@component
export class LabeledInput extends Composite {

  /** @type {string} */
  @bind({type: String, path: '#input.text'})
  text;

  /** @type {tabris.ChangeListeners<LabeledInput, 'text'>} */
  @event onTextChanged;

  /** @type {string} */
  @property labelText;

  /** @type {tabris.ChangeListeners<LabeledInput, 'labelText'>} */
  @event onLabelTextChanged;

  /** @type {tabris.Listeners<{target: LabeledInput}>} */
  @event onAccept;

  /** @param {Properties<LabeledInput>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <$>
        <TextView id='label'
            height={32} centerY={0}
            bind-text='labelText'
            font='20px'/>
        <TextInput id='input'
            left='prev() 12' width={250}
            font='20px'
            onAccept={this.onAccept.trigger}/>
      </$>
    );
  }

}
