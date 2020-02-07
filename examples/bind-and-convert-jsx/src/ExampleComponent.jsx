import {Composite, Stack, TextView} from 'tabris';
import {component, property, to} from 'tabris-decorators';

/** @param {string} path */
const toTimeString = path => to(path, (date) => date.toTimeString());

@component
export class ExampleComponent extends Composite {

  /** @type {string} */
  @property myText;

  /** @type {Date} */
  @property myTime;

  /** @param {tabris.Properties<ExampleComponent>} properties */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>

        <TextView>Date to string:</TextView>
        <TextView bind-text={to('myTime', date => date.toTimeString())}/>

        <TextView>More readable:</TextView>
        <TextView bind-text={toTimeString('myTime')}/>

        <TextView>Full syntax:</TextView>
        <TextView bind-text={{path: 'myTime', converter: date => date.toTimeString()}}/>

        <TextView>Template text:</TextView>
        <TextView template-text='Hello ${myText}!'/>

        <TextView>Exactly the same as:</TextView>
        <TextView bind-text={to('myText', myText => `Hello ${myText}!`)}/>
        <TextView bind-text={{path: 'myText', converter: myText => 'Hello ' + myText + '!'}}/>

      </Stack>
    );
    this._find(TextView).set({font: {size: 18}});
  }

}
