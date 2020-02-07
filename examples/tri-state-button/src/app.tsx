import {Button, contentView, Stack, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {Survey} from './Survey';
import {State} from './TriStateButton';

injector.jsxProcessor.strictMode = true;

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <Survey textColor={{red: 255, green: 10, blue: 10}} font='18px serif' apples milk/>
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
  if (state === true) {
    return 'Yes';
  }
  if (state === false) {
    return 'No';
  }
  return '(No answer)';
}
