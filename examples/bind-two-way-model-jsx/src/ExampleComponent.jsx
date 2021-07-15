import {Composite, Properties, Slider, Stack, TextInput, TextView, Color, Apply} from 'tabris';
import {bindAll, component, prop, event} from 'tabris-decorators';

export class Model {

  /** @type {string} */
  @prop(String) myText;

  /** @type {number} */
  @prop(Number) myNumber;

  /** @type {tabris.ColorValue} */
  @prop({nullable: true, type: Color}) myColor;

  /** @type {tabris.Listeners<{target: Model}>} */
  @event onBlink;

}

@component
export class ExampleComponent extends Composite {

  /** @type {Model} */
  @bindAll({
    myText: '#inputId.text',
    myNumber: ['Slider.selection', '>> #num.text'],
    myColor: '>> :host.background',
    onBlink() {
      this._find(Stack).only()
        .set({opacity: 0})
        .animate({opacity: 1}, {duration: 400})
        .catch(ex => console.log(ex));
    }
  })
  model;

  /** @param {Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>
        <Apply target={TextView} attr={{font: {size: 21}}}/>
        <TextView>Two-way binding to "myText":</TextView>
        <TextInput id='inputId' width={200} text='Fallback Text'/>
        <TextView>Two-way binding to "myNumber":</TextView>
        <Slider width={200}/>
        <TextView>One-way binding to "myNumber":</TextView>
        <TextView id='num'/>
      </Stack>
    );
  }

}
