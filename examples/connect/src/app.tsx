import {combineReducers, createStore} from 'redux';
import {Color, contentView, Stack} from 'tabris';
import {AnyAction, DefaultRootState, injector, register, StateProvider} from 'tabris-decorators';
import {ExampleComponent as ExampleComponent} from './ExampleComponent';
import {FunctionalComponent} from './FunctionalComponent';

injector.jsxProcessor.unsafeBindings = 'error';

declare module 'tabris-decorators' {

  // The state parameter provided by "@connect"
  export interface DefaultRootState {
    str: string;
    num: number;
  }

  // The actions accepted by "@connect"
  export interface DefaultActions {
    toggleNumber: {
      type: 'SET_RANDOM_NUMBER'
    };
    toggleString: {
      type: 'TOGGLE_STRING',
      checked: boolean
    };
  }

}

const store = createStore<DefaultRootState, AnyAction, {}, {}>(
  combineReducers<DefaultRootState, AnyAction>({
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
  })
);

register(StateProvider, store);

contentView.append(
  <Stack spacing={12} padding={12}>
    <ExampleComponent background={Color.silver}/>
    <FunctionalComponent background={Color.yellow}/>
  </Stack>
);
