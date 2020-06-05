declare module 'tabris-decorators' {

  export interface DefaultRootState {
    str: string;
    num: number;
  }

}

type Actions = {
  type: 'TOGGLE_VALUES',
  checked: boolean
};

type RootState = import('tabris-decorators').DefaultRootState;
