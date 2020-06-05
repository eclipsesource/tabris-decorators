const {combineReducers, createStore} = require('redux');
const {CheckBox, Color, contentView, Stack} = require('tabris');
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

/** @type {import('redux').Store<RootState, Actions>} */
const store = register(StateProvider, createStore(combineReducers(reducers)));

contentView.append(
  new Stack({
    layoutData: 'stretch',
    alignment: 'stretchX',
    padding: 12,
    spacing: 12
  }).append(
    new CheckBox({font: '24px', text: 'Toggle Store Values'}).onSelect(toggleStoreValues),
    new ExampleComponent({background: Color.silver})
  )
);

/**
 * @param {tabris.CheckBoxSelectEvent} ev
 */
function toggleStoreValues({checked}) {
  store.dispatch({type: 'TOGGLE_VALUES', checked});
}
