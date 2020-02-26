import {contentView, ProgressBar, PropertyChangedEvent, Stack, TextView} from 'tabris';
import {ExampleComponent, Model} from './ExampleComponent';

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

/** @param {PropertyChangedEvent<ExampleComponent, number>} ev */
function updateProgressBar(ev) {
  $(ProgressBar).only().selection = ev.value;
}

/** @param {PropertyChangedEvent<Model, string>} ev */
function updateTextView(ev) {
  $(TextView).last().text = ev.value;
}
