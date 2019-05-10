import { CheckBox, CheckBoxSelectEvent, Color, contentView, Stack } from 'tabris';
import { ExampleComponent, Model } from './ExampleComponent';

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleValues}>Toggle Values</CheckBox>
    <ExampleComponent background={Color.silver}/>
  </Stack>
);

function toggleValues({checked}: CheckBoxSelectEvent) {
  $(ExampleComponent).set({
    myText: checked ? 'Hello World' : undefined,
    myObject: checked ? new Model() : null
  });
}
