import { ChangeListeners, Composite, Listeners, Properties, TextInput, TextView } from 'tabris';
import { bind, component, event, property } from 'tabris-decorators';

@component
export class LabeledInput extends Composite {

  @bind('#input.text') public text: string;
  @event public readonly onTextChanged: ChangeListeners<LabeledInput, 'text'>;
  @property public labelText: string;
  @event public readonly onLabelTextChanged: ChangeListeners<LabeledInput, 'labelText'>;
  @event public readonly onAccept: Listeners<{target: LabeledInput}>;

  constructor(properties: Properties<LabeledInput>) {
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
