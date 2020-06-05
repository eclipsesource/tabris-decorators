import 'mocha';
import {createStore, Store} from 'redux';
import 'sinon';
import 'tabris';
import {expect, restoreSandbox, stub} from './test';
import {Injector, StateProvider} from '../src';

describe('StateProvider', () => {

  type MyState = {
    foo: number
  };

  type OtherState = {doesNotExist: any};

  type NotMyState<T> = T extends OtherState ? unknown : OtherState;

  let injector: Injector;
  let initialState: MyState;

  beforeEach(() => {
    injector = new Injector();
    initialState = {foo: 0};
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('constructor', () => {

    it('throws without original', () => {
      expect(() => new StateProvider(null)).to.throw();
    });

    it('wraps original', () => {
      const subscribe = stub();
      const subscriber = stub();

      const instance = new StateProvider({getState: () => initialState, subscribe});
      const state = instance.getState();
      instance.subscribe(subscriber);

      expect(state).to.equal(initialState);
      expect(subscribe).to.have.been.calledOnceWith(subscriber);
    });

    it('binds functions', () => {
      const original = {
        getState: stub(),
        subscribe: stub()
      };

      const instance = new StateProvider(original);
      instance.getState();
      instance.subscribe(() => undefined);

      expect(original.subscribe).to.have.been.calledOn(original);
      expect(original.getState).to.have.been.calledOn(original);
    });

  });

  describe('provide redux store', () => {

    let store: Store<MyState>;

    beforeEach(() => {
      store = createStore(state => state, initialState);
    });

    it('via @injectionHandler', () => {
      abstract class StoreInjectionHandler {
        @injector.injectionHandler(StateProvider)
        static getStateProvider(): StateProvider<MyState> {
          return store;
        }
      }

      const provider = injector.resolve(StateProvider);
      const state = provider.getState();

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(state.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
    });

    it('type-safe with @injectionHandler', () => {
      class MyStateProvider extends StateProvider<MyState> {
        @injector.injectionHandler(MyStateProvider)
        static getStateProvider(): MyStateProvider {
          return store;
        }
      }

      const provider = injector.resolve(MyStateProvider);
      const state = provider.getState();
      const unTyped: NotMyState<typeof state> = state as any;

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(unTyped.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
    });

    it('in wrapper with @shared', () => {
      @injector.shared
      class MyStateProvider extends StateProvider<MyState> {
        constructor() {
          super(store);
        }
      }

      const provider = injector.resolve(StateProvider);
      const state = provider.getState();

      expect(provider).to.be.instanceOf(MyStateProvider);
      expect(state.foo).to.equal(0);
      expect(state.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
    });

    it('type-safe in wrapper with @shared', () => {
      @injector.shared
      class MyStateProvider extends StateProvider<MyState> {
        constructor() {
          super(store);
        }
      }

      const provider = injector.resolve(MyStateProvider);
      const state = provider.getState();
      const unTyped: NotMyState<typeof state> = state as any;

      expect(provider).to.be.instanceOf(MyStateProvider);
      expect(state.foo).to.equal(0);
      expect(unTyped.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
    });

  });

});
