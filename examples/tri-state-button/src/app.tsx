import { Button, contentView, Stack, TextView } from 'tabris';
import { Survey } from './Survey';
import { State } from './TriStateButton';

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <Survey textColor='red' font='18px serif'/>
    <Button onSelect={printResults}>Print results</Button>
    <TextView markupEnabled font='18px serif'/>
  </Stack>
);

function printResults() {
  const survey = $(Survey).only();
  $(TextView).only().text = (
    <$>
      Pizza: {stateToAnswer(survey.pizza)}<br/>
      Milk: {stateToAnswer(survey.milk)}<br/>
      Apples: {stateToAnswer(survey.apples)}
    </$>
  );
}

function stateToAnswer(state: State) {
  if (state === 'checked') {
    return 'Yes';
  }
  if (state === 'crossed') {
    return 'No';
  }
  return '(No answer)';
}
