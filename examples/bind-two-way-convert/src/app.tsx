import {Button, contentView, Stack} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent background='silver'/>
    <Button autoCapitalize='none' onSelect={() => example.myText = 'Foo'}>Set to "Foo"</Button>
  </Stack>
);

const example = $(ExampleComponent).only();
