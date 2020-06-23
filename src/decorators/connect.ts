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

export function connect<
  Target extends {},
  RootState = DefaultRootState,
  Action extends GenericAction = AnyAction
>(
  mapState: StateMapper<Target extends Widget ? Properties<Target> : Partial<Target>, RootState> | null,
  mapDispatchToProps?: ActionMapper<Target, Action>
): <T extends Constructor<Target>>(target: T) => T {
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
      throw new Error(`Could not apply "connect" to ${target.name}: ${error.message}`);
    }
  };
}

function getProxy<T extends Constructor<any>>(type: T): T {
  const isProxy = !!Reflect.getOwnMetadata(componentConfigKey, type);
  const proxy = isProxy ? type : new Proxy(type, {
    construct: (target, constructorArgs, protoTarget) => construct({target, proxy, constructorArgs, protoTarget})
  });
  return proxy;
}

function updateConfig(target: Constructor<any>, config: Connection) {
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

function construct(options: ConstructOptions) {
  const {stateMapper, actionMapper}: Connection = Reflect.getOwnMetadata(componentConfigKey, options.proxy);
  const target = Reflect.construct(options.target, options.constructorArgs, options.protoTarget);
  if (stateMapper || actionMapper) {
    const stateProvider = getInjectable(StateProvider, options.constructorArgs);
    StateProvider.hook({stateProvider, target, stateMapper, actionMapper});
  }
  return target;
}

function addInjectorInjection(proxy: Constructor<any>, config: Connection) {
  if (config.stateMapper) {
    pushParameterInfo(proxy, {type: Injector, inject: true});
  }
}

function getInjectable<T extends object>(type: Constructor<T>, args: any[]): T {
  const injector = args.find(arg => arg instanceof Injector) || defaultInjector;
  return injector.resolve(type);
}

function pushParameterInfo(target: Constructor<any>, info: ParamInfo) {
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

type ConstructOptions = {
  target: Constructor<any>,
  constructorArgs: any[],
  protoTarget: any,
  proxy: Constructor<any>
};

type Connection = { stateMapper?: StateMapper<any>, actionMapper?: ActionMapper<any> };
