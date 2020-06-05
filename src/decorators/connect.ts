import {DefaultRootState} from '..';
import 'reflect-metadata';
import {Composite, Properties, Widget} from 'tabris';
import {component} from './component';
import {injector as defaultInjector, Injector} from '../api/Injector';
import {StateProvider} from '../api/StateProvider';
import {ParamInfo} from '../internals//utils-databinding';
import {Constructor, getOwnParamInfo} from '../internals/utils';

export type StateMapper<MappedState, RootState = DefaultRootState> = (state: RootState) => MappedState;

const componentConfigKey = Symbol();

export function connect<
  MappedState,
  RootState = DefaultRootState
>(mapState: StateMapper<MappedState extends Widget ? Properties<MappedState> : MappedState, RootState>):
  <T extends Constructor<MappedState>>(target: T) => T
{
  return target => {
    try {
      const config = {mapState};
      if (target.prototype instanceof Composite) {
        component(target as any);
      }
      const proxy = getProxy(target);
      updateConfig(proxy, config);
      addInjectorInjection(proxy, config);
      return proxy;
    } catch (error) {
      throw new Error(
        `Could not apply "connect" to ${target.name}: ${error.message}`
      );
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
  if (config.mapState) {
    if (current.mapState) {
      throw new Error('Component is already connected');
    }
    current.mapState = config.mapState;
  }
}

function construct(options: ConstructOptions) {
  const config: Connection = Reflect.getOwnMetadata(componentConfigKey, options.proxy);
  const instance = Reflect.construct(options.target, options.constructorArgs, options.protoTarget);
  if (config.mapState) {
    const stateProvider = getInjectable(StateProvider, options.constructorArgs);
    StateProvider.hook(stateProvider, instance, config.mapState);
  }
  return instance;
}

function addInjectorInjection(proxy: Constructor<any>, config: Connection) {
  if (config.mapState) {
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

type Connection = {mapState?: StateMapper<any>};
