import {contentView, ProgressBar, PropertyChangedEvent, Stack, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {ExampleComponent, Model} from './ExampleComponent';

injector.jsxProcessor.strictMode = true;

const model = new Model();

contentView.append(
  <Stack layoutData='stretch' alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent background='silver' model={model}
        onMyNumberChanged={updateProgressBar}/>
    <TextView font='18px'>Current values:</TextView>
    <ProgressBar width={200}/>
    <TextView font='18px'/>
  </Stack>
);

model.onMyTextChanged(updateTextView);

function updateProgressBar(ev: PropertyChangedEvent<ExampleComponent, number>) {
  $(ProgressBar).only().selection = ev.value;
}

function updateTextView(ev: PropertyChangedEvent<Model, string>) {
  $(TextView).last().text = ev.value;
}
