import {CheckBox, CheckBoxSelectEvent, Color, contentView, Stack} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent, Model} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

const model = new Model();

contentView.append(
  Stack({
    stretch: true ,
    alignment: 'stretchX',
    padding: 12,
    spacing: 12,
    children: [
      CheckBox({
        font: {size: 24},
        onSelect: toggleComponentValues,
        text: 'Toggle Component Values'
      }),
      CheckBox({
        font: {size: 24},
        onSelect: toggleModelValues,
        text: 'Toggle Model Values'
      }),
      ExampleComponent({background: Color.silver})
    ]
  })
);

function toggleComponentValues({checked}: CheckBoxSelectEvent) {
  $(ExampleComponent).set({
    myText: checked ? 'My Text' : undefined,
    myObject: checked ? model : undefined
  });
}

function toggleModelValues({checked}: CheckBoxSelectEvent) {
  model.someNumber = checked ? 90 : 10;
  model.otherModel.someString = checked ? 'Another Hello' : 'Hello World';
}
