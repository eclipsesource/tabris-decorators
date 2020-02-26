import {ChangeListeners, Composite, Properties, Slider, Stack, TextInput, TextView} from 'tabris';
import {bind, bindAll, component, event, property} from 'tabris-decorators';

export class Model {

  /** @type {ChangeListeners<Model, 'myText'>} */
  @event onMyTextChanged;

  /** @type {string} */
  @property myText;

}

@component
export class ExampleComponent extends Composite {

  /** @type {number} */
  @bind('#source1.selection') myNumber;

  /** @type {ChangeListeners<ExampleComponent, 'myNumber'>} */
  @event onMyNumberChanged;

  /** @type {Model} */
  @bindAll({myText: '#source2.text'}) model;

  /** @param {Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Source of "myNumber":</TextView>
        <Slider id='source1' width={200}/>

        <TextView>Source of "model.myText":</TextView>
        <TextInput id='source2' width={200}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
