import { ChangeListeners, Composite, Listeners, Properties, TextInput, TextView, WidgetCollection } from 'tabris';

export class LabeledInput extends Composite {

  onTextChanged = new ChangeListeners(this, 'text') ;
  onLabelTextChanged = new ChangeListeners(this, 'labelText');
  onAccept = new Listeners(this);

  /**
   * @param {Properties<LabeledInput>} properties
   */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <$>
        <TextView id='label' height={32} centerY={0} font='20px'
            onTextChanged={this.onLabelTextChanged.trigger}/>
        <TextInput id='input' left='prev() 12' width={250} font='20px'
            onAccept={this.onAccept.trigger}
            onTextChanged={this.onTextChanged.trigger}/>
      </$>
    );
  }

  children = () => new WidgetCollection([]); // encapsulate component

  set text(value) {
    this._find(TextView).only('#input').text = value;
  }

  get text() {
    return this._find(TextView).only('#input').text;
  }

  set labelText(value) {
    this._find(TextView).only('#label').text = value;
  }

  get labelText() {
    return this._find(TextView).only('#label').text;
  }

}
