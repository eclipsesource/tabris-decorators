import {AlertDialog, contentView} from 'tabris';
import {LabeledInput} from './LabeledInput';

contentView.append(
  <$>
    <LabeledInput id='firstname' labelText='First name:'/>
    <LabeledInput id='lastname' labelText='Last name:' onAccept={showName}/>
  </$>
).children().set({left: 12, top: 'prev() 12'});

function showName() {
  const firstName = $('#firstname').only(LabeledInput).text;
  const lastName = $('#lastname').only(LabeledInput).text;
  AlertDialog.open(`Hello ${firstName} ${lastName}!`);
}
