import { contentView, ProgressBar, PropertyChangedEvent, Stack, TextView } from 'tabris';
import { ExampleComponent } from './ExampleComponent';

contentView.append(
  <Stack layoutData='stretch' alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent background='silver'
        onMyNumberChanged={updateProgressBar}
        onMyTextChanged={updateTextView}/>
    <TextView font='18px'>Current values:</TextView>
    <ProgressBar width={200}/>
    <TextView font='18px'/>
  </Stack>
);

function updateProgressBar(ev: PropertyChangedEvent<ExampleComponent, number>) {
  $(ProgressBar).only().selection = ev.value;
}

function updateTextView(ev: PropertyChangedEvent<ExampleComponent, string>) {
  $(TextView).last().text = ev.value;
}
