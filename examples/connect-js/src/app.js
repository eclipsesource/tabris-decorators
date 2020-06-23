const {combineReducers, createStore} = require('redux');
const {Color, contentView} = require('tabris');
const {register, StateProvider} = require('tabris-decorators');
const {ExampleComponent} = require('./ExampleComponent');
/* globals RootState, Actions */

/** @type {import('redux').ReducersMapObject<RootState, Actions>} */
const reducers = {
  num(state, action) {
    if (action.type === 'TOGGLE_VALUES') {
      return action.checked ? 90 : 10;
    }
    return state || 0;
  },
  str(state, action) {
    if (action.type === 'TOGGLE_VALUES') {
      return action.checked ? 'Another Hello World' : 'Hello World';
    }
    return state || 'Hello World';
  }
};

register(StateProvider, createStore(combineReducers(reducers)));

contentView.append(new ExampleComponent({background: Color.silver}));
