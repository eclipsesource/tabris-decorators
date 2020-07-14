import {Action as GenericAction, AnyAction, Dispatch} from '..';
import {Listeners} from 'tabris';

export type ActionMapper<
  Target extends object,
  Action extends GenericAction = AnyAction
> = ActionMapperFunction<Target, Action> | ActionMapperObject<Target, Action>;

export type ActionMapperFunction<
  Target extends object,
  Action extends GenericAction = AnyAction
> = (dispatch: Dispatch<Action>) => Callbacks<Target>;

export type ActionMapperObject<Target extends object, Action extends GenericAction = AnyAction> = {
  [Key in CallbackKeysOf<Target>]?: ActionCreator<Target[Key], Action>;
};

export type Callbacks<T extends object> = {
  [Key in CallbackKeysOf<T>]?: UnpackListeners<T[Key]>;
};

export type Listener<T> = (ev: T) => any;

type UnpackListeners<T> = T extends Listeners<infer U> ? Listener<U> : T;

type EventObjectOfListeners<T extends Listeners<any>> = T extends Listeners<infer U> ? U : never;

type ActionCreator<TargetFunction extends (...args: any[]) => any, Action> = TargetFunction extends Listeners<any>
  ? (ev: EventObjectOfListeners<TargetFunction>) => Action
  : (...args: Parameters<TargetFunction>) => Action;

type FunctionKeysOf<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];

type Forbidden = 'append' | 'children' | 'find' | 'apply' | 'appendTo' | 'insertBefore'
  | 'insertAfter' | 'detach' | 'siblings' | 'animate' | 'dispose' | 'toString' | 'constructor'
  | 'bounds' | 'absoluteBounds';

type CallbackKeysOf<T> = FunctionKeysOf<Omit<T, Forbidden | number | symbol>>;

