import {Button, contentView, Slider, Stack, TextInput, TextView} from 'tabris';
import {injector} from 'tabris-decorators';
import {Person} from './Person';

injector.jsxProcessor.unsafeBindings = 'error';

const person = new Person();
person.age = 22;
person.name.firstName = 'Bernd';
person.name.lastName = 'Smith';

person.onAgeChanged(ev => log(`Age changed to ${ev.value}`));
person.onNameChanged(ev => log(`Name changed to ${ev.value}`));

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <TextInput message='Enter new first name' onAccept={changeName}/>
    <Button onSelect={changeName}>Change Name</Button>
    <Slider/>
    <Button onSelect={changeAge}>Change Age</Button>
    <TextView font={{size: 18}}/>
  </Stack>
);

log(`${person.name} is ${person.age}`);

function changeName() {
  person.name.firstName = $(TextInput).only().text;
}

function changeAge() {
  person.age = $(Slider).only().selection;
}

/** @param {string} message */
function log(message) {
  console.log(message);
  $(TextView).only().text = message;
}
