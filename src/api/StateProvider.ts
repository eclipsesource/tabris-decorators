import {Action as GenericAction, DefaultActions, DefaultRootState} from '..';
import {Listener, Listeners} from 'tabris';
import {ActionMapper, ActionMapperFunction, Callbacks} from './ActionMapper';

export type StateMapper<MappedState, RootState = DefaultRootState> = (state: RootState) => MappedState;

export interface Action<T = any> {
  type: T;
}

export type AnyAction = DefaultActions[keyof DefaultActions] | {type: typeof NO_ACTION};

export type Dispatch<A> = (action: A) => A;

export type HookOptions<
  RootState extends object,
  Target extends object,
  Action extends GenericAction = AnyAction
> = {
  stateProvider: StateProvider<RootState, Action>,
  target: Target & { set: (props: Partial<Target>) => any },
  stateMapper?: StateMapper<Partial<Target>, RootState>,
  actionMapper?: ActionMapper<Target>
};

export const NO_ACTION: unique symbol = Symbol();

export class StateProvider<State = DefaultRootState, Action extends GenericAction = AnyAction> {

  static hook<
    Target extends object,
    RootState extends object = DefaultRootState,
    Action extends GenericAction = AnyAction
  >(
    options: HookOptions<RootState, Target, Action>
  ) {
    hookActions(options);
    hookState(options);
  }

  constructor(original: Partial<StateProvider<State>>) {
    const {getState, subscribe, dispatch} = original;
    this.getState = getState ? getState.bind(original) : this.getState;
    this.subscribe = subscribe ? subscribe.bind(original) : this.subscribe;
    this.dispatch = dispatch ? dispatch.bind(original) : this.dispatch;
  }

  getState(): State {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe(cb: () => void): void {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch: Dispatch<Action> = () => {
    throw new Error('Not implemented');
  };

}

function hookState<Target extends object, RootState extends object>(options: HookOptions<Target, RootState>) {
  const {stateProvider, stateMapper, target} = options;
  if (stateMapper) {
    const update = () => {
      const mappedState = stateMapper(stateProvider.getState());
      if (Object.keys(mappedState).length) {
        target.set(mappedState);
      }
    };
    stateProvider.subscribe(update);
    update();
  }
}

function hookActions<Target extends object>(options: HookOptions<Target, {}>) {
  const {stateProvider, target, actionMapper} = options;
  if (actionMapper) {
    const actions = getActionMapperFn(actionMapper)(stateProvider.dispatch);
    const callbacks: Partial<Target> = {};
    const listeners: { [type: string]: Listener<any> } = {};
    for (const key in actions) {
      if (key.startsWith('on') && key.charCodeAt(2) <= 90) {
        const event = key[2].toLocaleLowerCase() + key.slice(3);
        listeners[event] = actions[key] as Listener<Target>;
      } else {
        callbacks[key] = actions[key];
      }
    }
    if (Object.keys(callbacks).length) {
      target.set(callbacks);
    }
    if (Object.keys(listeners).length) {
      Listeners.getListenerStore(target).on(listeners);
    }
  }
}

function getActionMapperFn<Target extends object>(
  actionMapper: ActionMapper<Target>
): ActionMapperFunction<Target> {
  if (actionMapper instanceof Function) {
    return actionMapper;
  }
  const actionCreators = Object.freeze(Object.assign({}, actionMapper));
  return dispatch => {
    const actions: Callbacks<Target> = {};
    for (const key in actionCreators) {
      actions[key] = (...args: any) => dispatch(actionCreators[key].apply(actionMapper, args));
    }
    return actions;
  };
}
