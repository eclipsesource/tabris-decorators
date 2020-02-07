import {Button, contentView, Stack, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';

injector.jsxProcessor.strictMode = true;

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent background='silver'/>
    <Button onSelect={changeValues}>Change values</Button>
    <Button onSelect={printValues}>Print current values</Button>
    <TextView font='18px' markupEnabled/>
  </Stack>
);

const example = $(ExampleComponent).only();

function changeValues() {
  example.myText = example.myText === 'foo' ? 'bar' : 'foo';
  example.myNumber = Math.round(Math.random() * 100);
  printValues();
}

function printValues() {
  $(TextView).only().text = (
    <$>
      myNumber: {example.myNumber}<br/>
      myText: "{example.myText}"
    </$>
  );
}
