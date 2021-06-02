import {ChangeListeners, Composite, Properties, Stack, TextInput, TextView} from 'tabris';
import {bind, component, BindingConverter, event} from 'tabris-decorators';

const toUpperCase: BindingConverter = (value: string, {targets, resolve}) =>
  resolve(targets(TextInput) ? value.toUpperCase() : value.toLowerCase());

@component
export class ExampleComponent extends Composite {

  @bind('TextInput.text', toUpperCase)
  myText: string = 'Hello World!';

  @event
  onMyTextChanged: ChangeListeners<ExampleComponent, 'myText'>;

  constructor(properties: Properties<ExampleComponent>) {
    super();
    this.set(properties);
    this.append(
      <Stack spacing={12} padding={12}>
        <TextView>Property "myText" to upper case:</TextView>
        <TextInput font={{size: 18}} width={200}/>
      </Stack>
    );
  }

}
