import {Button, contentView, Stack, TextInput, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {Person} from './Person';

injector.jsxProcessor.unsafeBindings = 'error';

const person = new Person();

contentView.append(
  <Stack layoutData='stretch' alignment='stretchX' padding={12} spacing={12}>
    <TextInput text='X' message='Name (at least 2 chars)' onAccept={changeName}/>
    <Button onSelect={changeName}>Change Name</Button>
    <TextInput text='-5' message='Age (positive number)' onAccept={changeAge}/>
    <Button onSelect={changeAge}>Change Age</Button>
    <TextView font={{size: 18}}/>
  </Stack>
);

function changeName() {
  try {
    person.name = $(TextInput).first().text;
    log(`Name is now ${person.name}`);
  } catch (ex) {
    log(ex.message);
  }
}

function changeAge() {
  try {
    person.age = parseInt($(TextInput).last().text, 10);
    log(`Age is now ${person.age}`);
  } catch (ex) {
    log(ex.message);
  }
}

function log(message: string) {
  console.log(message);
  $(TextView).only().text = message;
}
