import {combineReducers, createStore} from 'redux';
import {CheckBox, CheckBoxSelectEvent, Color, contentView, Stack} from 'tabris';
import {DefaultRootState, injector, StateProvider} from 'tabris-decorators';
import {register} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

declare module 'tabris-decorators' {

  export interface DefaultRootState {
    str: string;
    num: number;
  }

}

type RootState = DefaultRootState;

type Actions = {
  type: 'TOGGLE_VALUES',
  checked: boolean
};

const store = createStore<RootState, Actions, unknown, unknown>(
  combineReducers<RootState, Actions>({
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
  })
);

register(StateProvider, store);

contentView.append(
  <Stack stretch alignment='stretchX' padding={12} spacing={12}>
    <CheckBox font={{size: 24}} onSelect={toggleStoreValues}>
      Toggle Store Values
    </CheckBox>
    <ExampleComponent background={Color.silver}/>
  </Stack>
);

function toggleStoreValues({checked}: CheckBoxSelectEvent) {
  store.dispatch({type: 'TOGGLE_VALUES', checked});
}
