import {Composite, Properties, Slider, Stack, TextInput, TextView, Color} from 'tabris';
import {bindAll, component, prop} from 'tabris-decorators';

export class Model {

  /** @type {string} */
  @prop(String) myText;

  /** @type {number} */
  @prop(Number) myNumber;

  /** @type {tabris.ColorValue} */
  @prop({nullable: true, type: Color}) myColor;

}

@component
export class ExampleComponent extends Composite {

  /** @type {Model} */
  @bindAll({
    myText: '#inputId.text',
    myNumber: 'Slider.selection',
    myColor: '>> :host.background'
  })
  model;

  /** @param {Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Bound to "myText"</TextView>
        <TextInput id='inputId' width={200} text='Fallback Text'/>

        <TextView>Bound to "myNumber"</TextView>
        <Slider width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
