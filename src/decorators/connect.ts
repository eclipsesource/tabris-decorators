import {Action as GenericAction, AnyAction, DefaultRootState} from '..';
import 'reflect-metadata';
import {asFactory, CallableConstructor, JSXCandidate, Properties, tabris, Widget} from 'tabris';
import {ActionMapper} from '../api/ActionMapper';
import {injector as defaultInjector, Injector} from '../api/Injector';
import {StateMapper, StateProvider} from '../api/StateProvider';
import {ParamInfo} from '../internals//utils-databinding';
import {Constructor, getOwnParamInfo} from '../internals/utils';
const orgComponentKey: unique symbol = tabris.symbols.originalComponent as any;
const factoryProxyHandlerKey: unique symbol = tabris.symbols.proxyHandler as any;

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
  if (Reflect.getOwnMetadata(componentConfigKey, type)) {
    return type;
  }
  if (type[orgComponentKey]) {
    return wrapFactoryProxy(type);
  }
  return createNewProxy(type);
}

function createNewProxy<T extends Connectable<any>>(type: T): T {
  const proxy = new Proxy(type, {
    construct: (target, constructorArgs, protoTarget) => construct(
      {target: (target as Constructor<any>), proxy, creationArgs: constructorArgs, context: protoTarget}
    ),
    apply: (target, thisArg, callArgs) => apply(
      {target: (target as Constructor<any>), proxy, creationArgs: callArgs, context: thisArg}
    ),
    get: (target, property, receiver) => {
      if (receiver === proxy && property === orgComponentKey) {
        throw new Error('Must call "asFactory"/"component" before "connect"');
      }
      return Reflect.get(target, property, receiver);
    }
  });
  return proxy;
}

function wrapFactoryProxy<T extends Connectable<JSXCandidate>>(type: T): T {
  const proxy: CallableConstructor<any> = asFactory(type as any);
  const handler: ProxyHandler<T> = proxy[factoryProxyHandlerKey];
  handler.construct = (target, constructorArgs, protoTarget) => construct(
    {target: (target as Constructor<any>), proxy, creationArgs: constructorArgs, context: protoTarget}
  );
  handler.get = (target, property, receiver) => {
    if (receiver === proxy && property === orgComponentKey) {
      throw new Error('Must call "asFactory"/"component" before "connect"');
    }
    return Reflect.get(target, property, receiver);
  };
  return proxy as any;
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
    const stateProvider = getInjectable(StateProvider, target, creationArgs);
    StateProvider.hook({stateProvider, target, stateMapper, actionMapper});
  }
  return target;
}

function addInjectorInjection(proxy: Connectable<any>, config: Connection) {
  if (proxy.prototype && config.stateMapper || config.actionMapper) {
    pushParameterInfo(proxy, {type: Injector, inject: true});
  }
}

function getInjectable<T extends object>(type: Constructor<T>, target: object, args: any[]): T {
  const injector = args.find(arg => arg instanceof Injector) || Injector.get(target, defaultInjector);
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
