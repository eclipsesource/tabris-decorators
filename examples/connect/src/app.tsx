import {combineReducers, createStore} from 'redux';
import {Color, contentView} from 'tabris';
import {AnyAction, DefaultRootState, injector, register, StateProvider} from 'tabris-decorators';
import {ExampleComponent} from './ExampleComponent';

injector.jsxProcessor.unsafeBindings = 'error';

declare module 'tabris-decorators' {

  // The state parameter provided by "@connect"
  export interface DefaultRootState {
    str: string;
    num: number;
  }

  // The actions accepted by "@connect"
  export interface DefaultActions {
    toggle: {
      type: 'TOGGLE_VALUES',
      checked: boolean
    };
  }

}

const store = createStore<DefaultRootState, AnyAction, {}, {}>(
  combineReducers<DefaultRootState, AnyAction>({
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
  <ExampleComponent background={Color.silver}/>
);
