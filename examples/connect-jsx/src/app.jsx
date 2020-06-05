import {combineReducers, createStore} from 'redux';
import {CheckBox, Color, contentView, Stack} from 'tabris';
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

/** @type {import('redux').Store<RootState, Actions>} */
const store = register(StateProvider, createStore(combineReducers(reducers)));

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleStoreValues}>
      Toggle Store Values
    </CheckBox>
    <ExampleComponent background={Color.silver}/>
  </Stack>
);

/**
 * @param {tabris.CheckBoxSelectEvent} ev
 */
function toggleStoreValues({checked}) {
  store.dispatch({type: 'TOGGLE_VALUES', checked});
}
