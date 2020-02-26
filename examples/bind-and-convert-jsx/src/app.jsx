import {CheckBox, Color, contentView, Stack} from 'tabris';
import {ExampleComponent} from './ExampleComponent';

const time1 = new Date(0, 0, 0, 10, 30);
const time2 = new Date(0, 0, 0, 22, 45);

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleValues}>Toggle Values</CheckBox>
    <ExampleComponent background={Color.silver}/>
  </Stack>
);

/** @param {tabris.CheckBoxSelectEvent} ev */
function toggleValues({checked}) {
  $(ExampleComponent).set({
    myText: checked ? 'World' : 'darkness my old friend',
    myTime: checked ? time1 : time2
  });
}
