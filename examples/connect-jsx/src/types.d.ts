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

type RootState = import('tabris-decorators').DefaultRootState;
type Actions = import('tabris-decorators').AnyAction;

type StateToProps<T> = import('tabris-decorators').StateMapper<tabris.Properties<T>>;
type DispatchToProps<T> = import('tabris-decorators').ActionMapperFunction<T>;
