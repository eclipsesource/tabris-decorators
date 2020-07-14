import {Action as GenericAction, AnyAction, DefaultRootState} from '..';
import 'reflect-metadata';
import {Composite, Properties, Widget} from 'tabris';
import {component} from './component';
import {ActionMapper} from '../api/ActionMapper';
import {injector as defaultInjector, Injector} from '../api/Injector';
import {StateMapper, StateProvider} from '../api/StateProvider';
import {ParamInfo} from '../internals//utils-databinding';
import {Constructor, getOwnParamInfo} from '../internals/utils';

const componentConfigKey = Symbol();

export type Connectable<T> = Constructor<T> | ((attributes?: any) => T);

export function connect<
  Target extends {},
  RootState = DefaultRootState,
  Action extends GenericAction = AnyAction
>(
  mapState: StateMapper<Target extends Widget ? Properties<Target> : Partial<Target>, RootState> | null,
  mapDispatchToProps?: ActionMapper<Target, Action>
): <T extends Connectable<Target>>(target: T) => T {
  return target => {
    try {
      const config: Connection = {stateMapper: mapState, actionMapper: mapDispatchToProps};
      if (target.prototype instanceof Composite) {
        component(target as any);
      }
      const proxy = getProxy(target);
      updateConfig(proxy, config);
      addInjectorInjection(proxy, config);
      return proxy;
    } catch (error) {
      throw new Error(`Could not apply "connect" to ${target.name || 'component'}: ${error.message}`);
    }
  };
}

function getProxy<T extends Connectable<any>>(type: T): T {
  const isProxy = !!Reflect.getOwnMetadata(componentConfigKey, type);
  const proxy = isProxy ? type : new Proxy(type, {
    construct: (target, constructorArgs, protoTarget) => construct(
      {target: (target as Constructor<any>), proxy, creationArgs: constructorArgs, context: protoTarget}
    ),
    apply: (target, thisArg, callArgs) => apply(
      {target: (target as Constructor<any>), proxy, creationArgs: callArgs, context: thisArg}
    )
  });
  return proxy;
}

function updateConfig(target: Connectable<any>, config: Connection) {
  let current: Connection = Reflect.getOwnMetadata(componentConfigKey, target);
  if (!current) {
    current = {};
    Reflect.defineMetadata(componentConfigKey, current, target);
  }
  if (config.stateMapper) {
    if (current.stateMapper) {
      throw new Error('Component is already connected');
    }
    current.stateMapper = config.stateMapper;
  }
  if (config.actionMapper) {
    if (current.actionMapper) {
      throw new Error('Component is already connected');
    }
    current.actionMapper = config.actionMapper;
  }
}

function construct(options: ConnectedCreationOptions) {
  const connection: Connection = Reflect.getOwnMetadata(componentConfigKey, options.proxy);
  const target = Reflect.construct(options.target, options.creationArgs, options.context);
  return connectTarget(target, connection, options);
}

function apply(options: ConnectedCreationOptions) {
  const connection: Connection = Reflect.getOwnMetadata(componentConfigKey, options.proxy);
  const target = Reflect.apply(options.target, options.context, options.creationArgs);
  return connectTarget(target, connection, options);
}

function connectTarget(
  target: object,
  {stateMapper, actionMapper}: Connection,
  {creationArgs}: ConnectedCreationOptions
) {
  if (target && (stateMapper || actionMapper)) {
    const stateProvider = getInjectable(StateProvider, creationArgs);
    StateProvider.hook({stateProvider, target, stateMapper, actionMapper});
  }
  return target;
}

function addInjectorInjection(proxy: Connectable<any>, config: Connection) {
  if (proxy.prototype && config.stateMapper || config.actionMapper) {
    pushParameterInfo(proxy, {type: Injector, inject: true});
  }
}

function getInjectable<T extends object>(type: Constructor<T>, args: any[]): T {
  const injector = args.find(arg => arg instanceof Injector) || defaultInjector;
  return injector.resolve(type);
}

function pushParameterInfo(target: Connectable<any>, info: ParamInfo) {
  const paramInfo = getOwnParamInfo(target);
  if (paramInfo.find(entry => entry
    && entry.type === info.type
    && entry.inject === info.inject
    && entry.injectParam === info.injectParam
  )) {
    return;
  }
  paramInfo[Math.max(1, paramInfo.length, target.length)] = info;
}

type ConnectedCreationOptions = {
  target: Constructor<any>,
  creationArgs: any[],
  context: any,
  proxy: Constructor<any>
};

type Connection = { stateMapper?: StateMapper<any>, actionMapper?: ActionMapper<any> };
