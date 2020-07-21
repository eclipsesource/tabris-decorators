import {combineReducers, createStore} from 'redux';
import {Color, contentView, Stack} from 'tabris';
import {register, StateProvider} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';
import {FunctionalComponent} from './FunctionalComponent';
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
  <Stack spacing={12} padding={12}>
    <ExampleComponent background={Color.silver}/>
    <FunctionalComponent background={Color.silver}/>
  </Stack>
);
