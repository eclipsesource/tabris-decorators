import {Composite, Stack, TextView} from 'tabris';
import {component, property, ListView} from 'tabris-decorators';

@component
export class ExampleComponent extends Composite {

  /** @type {import('tabris-decorators').List<string>} */
  @property stringList;

  /** @type {tabris.Properties<ExampleComponent>} */
  constructor(properties) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} stretch>
        <TextView font={{size: 18}}>Binding string List to plain ListView:</TextView>
        <ListView stretch cellHeight={24} bind-items='stringList'/>
      </Stack>
    );
  }

}
