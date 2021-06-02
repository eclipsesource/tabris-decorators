import {Button, contentView, Stack, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent background='silver' onMyTextChanged={printValues}/>
    <Button autoCapitalize='none' onSelect={() => example.myText = 'Foo'}>Set to "Foo"</Button>
    <TextView font='18px' markupEnabled/>
  </Stack>
);

const example = $(ExampleComponent).only();
printValues();

function printValues() {
  $(TextView).only().text = `myText: "${example.myText}"`;
}
