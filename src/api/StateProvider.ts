import {Action as GenericAction, DefaultActions, DefaultRootState} from '..';
import {checkType, Composite, tabris, Widget, WidgetCollection} from 'tabris';
import {ActionMapper, ActionMapperFunction, ActionMapperObject, Callbacks} from './ActionMapper';

export type MappedRules = {[selector: string]: {[props: string]: any}};

export type StateMapper<MappedState, RootState = DefaultRootState>
  = (state: RootState) => MappedState & {apply?: MappedRules};

export interface Action<T = any> {
  type: T;
}

export type AnyAction = DefaultActions[keyof DefaultActions] | {type: typeof NO_ACTION};

export type Dispatch<A> = (action: A) => A;

export type HookOptions<
  Target extends Widget,
  RootState extends object,
  ProviderAction extends GenericAction
> = {
  stateProvider: StateProvider<RootState, ProviderAction>,
  target: Target,
  stateMapper?: StateMapper<Partial<Target>, RootState>,
  actionMapper?: ActionMapper<Target, ProviderAction>
};

export const NO_ACTION: unique symbol = Symbol();

export class StateProvider<State = DefaultRootState, ProviderAction extends GenericAction = AnyAction> {

  static hook<
    Target extends Widget,
    RootState extends object,
    HookedProviderAction extends GenericAction
  >(
    options: HookOptions<Target, RootState, HookedProviderAction>
  ) {
    hookActions(options);
    hookState(options);
  }

  constructor(original: Partial<StateProvider<State, ProviderAction>>) {
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
  dispatch: Dispatch<ProviderAction> = () => {
    throw new Error('Not implemented');
  };

}

function hookState<
  Target extends Widget,
  RootState extends object,
  ProviderAction extends GenericAction,
>(options: HookOptions<Target, RootState, ProviderAction>) {
  const {stateProvider, stateMapper, target} = options;
  if (stateMapper) {
    const widget = checkType(target, Widget, {name: 'target'});
    const update = () => applyRules(widget, stateMapper(stateProvider.getState()));
    update();
    stateProvider.subscribe(update);
  }
}

function hookActions<Target extends Widget, ProviderAction extends GenericAction>(
  options: HookOptions<Target, {}, ProviderAction>
) {
  const {stateProvider, target, actionMapper} = options;
  if (actionMapper) {
    const widget = checkType(target, Widget, {name: 'target'});
    applyRules(widget, getActionMapperFn(actionMapper)(stateProvider.dispatch));
  }
}

function getActionMapperFn<Target extends Widget, ProviderAction extends GenericAction>(
  actionMapper: ActionMapper<Target, ProviderAction>
): ActionMapperFunction<Target, ProviderAction> {
  if (actionMapper instanceof Function) {
    return actionMapper;
  }
  const actionCreators = Object.freeze(Object.assign({}, actionMapper));
  return dispatch => toActionDispatchers(dispatch, actionCreators);
}

function toActionDispatchers(
  dispatch: Dispatch<any>,
  actionCreators: ActionMapperObject<any, any>,
  noApply?: boolean
): Callbacks<{}> {
  const actions: Callbacks<{apply?: object}> = {};
  for (const key in actionCreators) {
    if (key === 'apply') {
      if (noApply) {
        throw new Error('apply-in-apply');
      }
      actions.apply = {};
      for (const selector in actionCreators.apply) {
        actions.apply[selector]
          = toActionDispatchers(dispatch, actionCreators.apply[selector], true) as any;
      }
    } else {
      actions[key] = (...args: any) => dispatch(actionCreators[key].apply({}, args));
    }
    return actions;
  }
}

/**
 * Tabris-internal function only exported for this project
 * TODO: Create functionally equivalent public API
 */
type ApplyRules = (
  applyArgs: {rules: object, mode: string, trigger: string},
  host: Widget,
  scope: WidgetCollection,
  internal: true
) => void;

const applyRulesInternal: ApplyRules = (tabris as any).applyRules;
if (!applyRulesInternal) {
  throw new Error('Failed to access tabris internals. Outdated module version?');
}

function applyRules(widget: Widget, targetState: {apply?: object}) {
  checkType(targetState, Object, {nullable: false, name: 'target state'});
  const {apply: rules, ...props} = targetState;
  checkType(rules, Object, {nullable: true, name: 'apply'});
  if (Object.keys(props).length) {
    const args = {rules: {':host': props}, mode:'strict', trigger: 'rules'};
    applyRulesInternal(args, widget, new WidgetCollection([widget]), true);
  }
  const selectors = Object.keys(rules || {});
  if (selectors.length) {
    const composite = checkType(widget, Composite, {nullable: true, name: 'apply'});
    const args = {rules, mode:'strict', trigger: 'rules'};
    applyRulesInternal(args, composite, composite.find('*'), true);
  }
}
