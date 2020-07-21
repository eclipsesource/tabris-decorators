const {combineReducers, createStore} = require('redux');
const {Color, contentView, Stack} = require('tabris');
const {register, StateProvider} = require('tabris-decorators');
const {ExampleComponent} = require('./ExampleComponent');
const {FunctionalComponent} = require('./FunctionalComponent');
/* globals RootState, Actions */

/** @type {import('redux').ReducersMapObject<RootState, Actions>} */
const reducers = {
  num(state, action) {
    if (action.type === 'SET_RANDOM_NUMBER') {
      return Math.round(Math.random() * 100);
    }
    return state || 0;
  },
  str(state, action) {
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
