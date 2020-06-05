import {DefaultRootState} from '..';

export class StateProvider<State = DefaultRootState> {

  static hook<RootState extends object, Target extends object>(
    stateProvider: StateProvider<RootState>,
    target: Target & {set: (props: Target) => any},
    mapper: (rootState: RootState) => Target
  ) {
    const update = () => target.set(mapper(stateProvider.getState()));
    stateProvider.subscribe(update);
    update();
  }

  constructor(original: StateProvider<State>) {
    this.getState = original.getState.bind(original);
    this.subscribe = original.subscribe.bind(original);
  }

  getState(): State {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe(cb: () => void): void {
    throw new Error('Not implemented');
  }

}
