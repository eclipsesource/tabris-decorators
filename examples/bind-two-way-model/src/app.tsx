import {Button, CheckBox, CheckBoxSelectEvent, Color, contentView, Stack, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent, Model} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

const model = new Model();
resetValues();

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleModelAttached}>
      Attach Model
    </CheckBox>
    <ExampleComponent background={Color.silver}/>
    <Button onSelect={resetValues}>
      Reset Model Values
    </Button>
    <Button onSelect={printValues}>
      Print Model Values
    </Button>
    <Button onSelect={model.onBlink.trigger}>
      Blink
    </Button>
    <TextView/>
  </Stack>
);

function toggleModelAttached({checked}: CheckBoxSelectEvent) {
  $(ExampleComponent).only().model = checked ? model : null;
}

function resetValues() {
  model.myText = 'Initial Model Text';
  model.myNumber = 50;
  model.myColor = Color.yellow;
}

function printValues() {
  $(TextView).only().text = model.myText + '/' + model.myNumber;
}
