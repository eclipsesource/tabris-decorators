const {combineReducers, createStore} = require('redux');
const {Color, contentView, Stack} = require('tabris');
const {register, StateProvider} = require('tabris-decorators');
const {FunctionalComponent} = require('./FunctionalComponent');
const {ExampleComponent} = require('./ExampleComponent');

/** @type {import('redux').ReducersMapObject<any, any>} */
const reducers = {
  myNumber(state, action) {
    if (action.type === 'SET_RANDOM_NUMBER') {
      return Math.round(Math.random() * 100);
    }
    return state || 0;
  },
  myString(state, action) {
    if (action.type === 'TOGGLE_STRING') {
      return action.checked ? 'Another Hello World' : 'Hello World';
    }
    return state || 'Hello World';
  }
};

register(StateProvider, createStore(combineReducers(reducers)));

contentView.append(
  Stack({
    padding: 12,
    spacing: 12,
    children: [
      ExampleComponent({background: Color.silver}),
      FunctionalComponent({background: Color.silver})
    ]
  })
);
