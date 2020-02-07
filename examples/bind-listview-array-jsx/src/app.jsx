import {Color, contentView, Stack, TextView} from 'tabris';
import {ExampleComponent} from './ExampleComponent';

/** @type {number} */
let count = 0;

/** @type {string[]} */
let items = Array.from(generate(20));

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <ExampleComponent stretch background={Color.silver} stringList={items}/>
    <TextView markupEnabled font={{size: 24}} onTapLink={e => modify(e.url)}>
      Modify List: <a href='set'>set item</a> <a href='insert'>insert item</a> <a href='remove'>remove item</a>
      &nbsp;<a href='clear'>clear all</a> <a href='replace'>replace all</a> <a href='pop'>pop()</a>
      &nbsp;<a href='push'>push()</a> <a href='shift'>shift()</a> <a href='unshift'>unshift()</a>
    </TextView>
  </Stack>
);

/** @param {string} type */
function modify(type) {
  items = items.concat();
  if (type === 'set') {
    items[randomIndex()] = generate(1)[0];
  } else if (type === 'insert') {
    items.splice(randomIndex(), 0, ...generate(1));
  } else if (type === 'remove') {
    items.splice(randomIndex(), 1);
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
  $(ExampleComponent).set({stringList: items});
}

/**
 * @param {number} num
 * @returns {string[]}
 */
function generate(num) {
  const arr = [];
  for (let i = 0; i < num; i++) {
    arr[i] = 'Item ' + count++;
  }
  return arr;
}

/** @returns {number} */
function randomIndex() {
  return Math.round(Math.random() * (items.length - 1));
}
