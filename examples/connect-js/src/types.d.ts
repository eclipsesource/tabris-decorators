declare module 'tabris-decorators' {

  // The state parameter provided by "@connect"
  export interface DefaultRootState {
    myString: string;
    myNumber: number;
  }

  // The actions accepted by "@connect"
  export interface DefaultActions {
    setRandomNumber: {
      type: 'SET_RANDOM_NUMBER'
    };
    toggleString: {
      type: 'TOGGLE_STRING',
      checked: boolean
    };
  }

}

declare global {

  type State = import('tabris-decorators').DefaultRootState;
  type Actions = import('tabris-decorators').AnyAction;
  type StateToProps<T> = import('tabris-decorators').StateToProps<T>;
  type DispatchToProps<T> = import('tabris-decorators').DispatchToProps<T>;
  type Reducers = import('redux').ReducersMapObject<State, Actions>;

}
