import { CheckBox, CheckBoxSelectEvent, Color, contentView, Stack } from 'tabris';
import { ExampleComponent, Model } from './ExampleComponent';

const model = new Model();

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleComponentValues}>
      Toggle Component Values
    </CheckBox>
    <CheckBox font={{size: 24}} onSelect={toggleModelValues}>
      Toggle Model Values
    </CheckBox>
    <ExampleComponent background={Color.silver}/>
  </Stack>
);

function toggleComponentValues({checked}: CheckBoxSelectEvent) {
  $(ExampleComponent).set({
    myText: checked ? 'My Text' : undefined,
    myObject: checked ? model : null
  });
}

function toggleModelValues({checked}: CheckBoxSelectEvent) {
  model.someNumber = checked ? 90 : 10;
  model.otherModel.someString = checked ? 'Another Hello' : 'Hello World';
}
