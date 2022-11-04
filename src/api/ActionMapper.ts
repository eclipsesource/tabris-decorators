import {Action as GenericAction, Dispatch} from '..';
import {EventOfListeners, Listeners, UnpackListeners} from 'tabris';
import {MappedRules} from './StateProvider';

export type ActionMapper<
  Target extends {},
  Action extends GenericAction
> = ActionMapperFunction<Target, Action> | ActionMapperObject<Target, Action>;

export type ActionMapperFunction<
  Target extends {},
  Action extends GenericAction
> = (dispatch: Dispatch<Action>) => Callbacks<Target>;

export type ActionMapperObject<Target extends {}, Action extends GenericAction> = {
  [Key in CallbackKeysOf<Target>]?: ActionCreator<Target[Key], Action>;
} & {
  apply?: MappedRules
};

export type Callback = (...args: any[]) => any;

export type Callbacks<T extends object> = {
  [Key in CallbackKeysOf<T>]?: UnpackListeners<T[Key]>;
} & {
  apply?: MappedRules
};

type ActionCreator<TargetFunction, Action>
  = TargetFunction extends Listeners<any> ? (ev: EventOfListeners<TargetFunction>) => Action
    : TargetFunction extends (...args: any[]) => any ? (...args: Parameters<TargetFunction>) => Action
    : any;

type FunctionKeysOf<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];

type Forbidden = 'append' | 'children' | 'find' | 'apply' | 'appendTo' | 'insertBefore'
  | 'insertAfter' | 'detach' | 'siblings' | 'animate' | 'dispose' | 'toString' | 'constructor'
  | 'bounds' | 'absoluteBounds';

type CallbackKeysOf<T> = FunctionKeysOf<Omit<T, Forbidden | number | symbol>>;

