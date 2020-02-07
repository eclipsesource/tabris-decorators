import {Color, contentView, Stack, TextView} from 'tabris';
import {List} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';
import {generate} from './Person';

/** @typedef {import('./Person').Person} Person */

/** @type {List<Person>} */
const items = List.from(generate(10));

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent stretch background={Color.silver} persons={items}/>
    <TextView markupEnabled font={{size: 24}} onTapLink={e => modify(e.url)}>
      Modify List: <a href='set'>set item</a> <a href='modify'>modify item</a>
      &nbsp;<a href='insert'>insert item</a> <a href='remove'>remove item</a>
      &nbsp;<a href='clear'>clear all</a> <a href='replace'>replace all</a> <a href='pop'>pop()</a>
      &nbsp;<a href='push'>push()</a> <a href='push'>push()</a> <a href='shift'>shift()</a>
      &nbsp;<a href='unshift'>unshift()</a>
    </TextView>
  </Stack>
);

/** @param {string} type */
function modify(type) {
  if (type === 'set') {
    items[selectionIndex()] = generate(1)[0];
  } else if (type === 'modify') {
    items[selectionIndex()].name = generate(1)[0].name;
  } else if (type === 'insert') {
    items.splice(selectionIndex(), 0, ...generate(1));
  } else if (type === 'remove') {
    items.splice(selectionIndex(), 1);
  } else if (type === 'clear') {
    items.length = 0;
  } else if (type === 'replace') {
    items.splice(0, items.length, ...generate(items.length));
  } else if (type === 'pop') {
    items.pop();
  } else if (type === 'push') {
    items.push(...generate(1));
  } else if (type === 'shift') {
    items.shift();
  } else if (type === 'unshift') {
    items.unshift(...generate(1));
  }
}

/** @returns {Person} */
function selectionIndex() {
  return items.indexOf($(ExampleComponent).only().details);
}
