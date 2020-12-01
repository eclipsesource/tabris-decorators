import {Composite, ProgressBar, Stack, TextView, Apply} from 'tabris';
import {component, property} from 'tabris-decorators';

export class OtherModel {
  /** @type {string} */
  @property someString = 'Hello World';
}

export class Model {

  /** @type {OtherModel} */
  @property otherModel = new OtherModel();

  /** @type {number} */
  @property someNumber = 10;
}

@component
export class ExampleComponent extends Composite {

  /** @type {string} */
  @property myText;

  /** @type {Model} */
  @property myObject;

  /** @param {tabris.Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>
        <Apply target={TextView} attr={{font: {size: 21}}}/>

        <TextView>Binding to a component property:</TextView>
        <TextView background='yellow'
            bind-text='myText'
            text='Placeholder'/>

        <TextView>Binding to a object property:</TextView>
        <ProgressBar bind-selection='myObject.someNumber' width={200}/>

        <TextView>Binding to a nested object property:</TextView>
        <TextView background='yellow'
            bind-text='myObject.otherModel.someString'
            text='Placeholder'/>
      </Stack>
    );
  }

}
