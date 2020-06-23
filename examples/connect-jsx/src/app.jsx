import {combineReducers, createStore} from 'redux';
import {Color, contentView} from 'tabris';
import {register, StateProvider} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';
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

contentView.append(
  <ExampleComponent background={Color.silver}/>
);
