import { Composite, Properties, Stack, TextView } from 'tabris';
import { component, property } from 'tabris-decorators';
import { ListView } from 'tabris-decorators';
import { List } from 'tabris-decorators';

@component
export class ExampleComponent extends Composite {

  @property public stringList: string[];

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12} stretch>
        <TextView font={{size: 18}}>Binding string Array to plain ListView:</TextView>
        <ListView stretch bind-items='stringList'/>
      </Stack>
    );
  }

}
