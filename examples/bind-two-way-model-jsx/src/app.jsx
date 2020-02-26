import {Button, CheckBox, CheckBoxSelectEvent, Color, contentView, Stack, TextView} from 'tabris';
import {ExampleComponent, Model} from './ExampleComponent';

const model = new Model();
resetValues();

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleModelAttached}>
      Attach Model
    </CheckBox>
    <Button onSelect={resetValues}>
      Reset Model Values
    </Button>
    <Button onSelect={printValues}>
      Print Model Values
    </Button>
    <ExampleComponent background={Color.silver}/>
    <TextView/>
  </Stack>
);

/** @param {CheckBoxSelectEvent} ev */
function toggleModelAttached({checked}) {
  $(ExampleComponent).only().model = checked ? model : null;
}

function resetValues() {
  model.myText = 'Initial Model Text';
  model.myNumber = 50;
}

function printValues() {
  $(TextView).only().text = model.myText + '/' + model.myNumber;
}
