import 'mocha';
import {createStore, Reducer, Store} from 'redux';
import 'sinon';
import {EventObject, Listeners} from 'tabris';
import {expect, restoreSandbox, spy, stub} from './test';
import {ActionMapper, Dispatch, Injector, StateProvider} from '../src';

describe('StateProvider', () => {

  type MyState = {
    foo: number
  };

  type OtherState = {doesNotExist: any};

  type NotMyState<T> = T extends OtherState ? unknown : OtherState;

  type MyAction = {type: 'DO_BAR'} | {type: 'DO_FOO'};

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
      const dispatch = stub();
      const subscriber = stub();
      const action = {type: 'FOO'};

      const instance = new StateProvider({
        getState: () => initialState, subscribe, dispatch
      });
      const state = instance.getState();
      instance.subscribe(subscriber);
      instance.dispatch(action);

      expect(state).to.equal(initialState);
      expect(subscribe).to.have.been.calledOnceWith(subscriber);
      expect(dispatch).to.have.been.calledOnceWith(action);
    });

    it('binds functions', () => {
      const original = {
        getState: stub(),
        subscribe: stub(),
        dispatch: stub()
      };

      const instance = new StateProvider(original);
      instance.getState();
      instance.subscribe(() => undefined);
      instance.dispatch({type: 'FOO'});

      expect(original.subscribe).to.have.been.calledOn(original);
      expect(original.getState).to.have.been.calledOn(original);
      expect(original.dispatch).to.have.been.calledOn(original);
    });

  });

  describe('provide redux store', () => {

    let store: Store<MyState, MyAction>;
    let reducer: Reducer<MyState, MyAction>;
    let action: MyAction;

    beforeEach(() => {
      action = {type: 'DO_BAR'};
      reducer = stub().returnsArg(0);
      store = createStore(reducer, initialState);
    });

    it('via @injectionHandler', () => {
      abstract class StoreInjectionHandler {
        @injector.injectionHandler(StateProvider)
        static getStateProvider(): StateProvider<MyState, MyAction> {
          return store;
        }
      }

      const provider = injector.resolve(StateProvider);
      const state = provider.getState();
      provider.dispatch(action);

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(state.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

    it('type-safe with @injectionHandler', () => {
      class MyStateProvider extends StateProvider<MyState, MyAction> {
        @injector.injectionHandler(MyStateProvider)
        static getStateProvider(): MyStateProvider {
          return store;
        }
      }

      const provider = injector.resolve(MyStateProvider);
      const state = provider.getState();
      const unTyped: NotMyState<typeof state> = state as any;
      provider.dispatch(action);

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(unTyped.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

    it('via register', () => {
      injector.register(StateProvider, store);

      const provider = injector.resolve(StateProvider);
      const state = provider.getState();
      provider.dispatch(action);

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(state.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

    it('type-safe via register', () => {
      abstract class MyStateProvider extends StateProvider<MyState, MyAction> { }
      injector.register(MyStateProvider, store);

      const provider = injector.resolve(MyStateProvider);
      const state = provider.getState();
      const unTyped: NotMyState<typeof state> = state as any;
      provider.dispatch(action);

      expect(provider).to.equal(store);
      expect(state.foo).to.equal(0);
      expect(unTyped.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

    it('in wrapper with @shared', () => {
      @injector.shared
      class MyStateProvider extends StateProvider<MyState, MyAction> {
        constructor() {
          super(store);
        }
      }

      const provider = injector.resolve(StateProvider);
      const state = provider.getState();
      provider.dispatch(action);

      expect(provider).to.be.instanceOf(MyStateProvider);
      expect(state.foo).to.equal(0);
      expect(state.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

    it('type-safe in wrapper with @shared', () => {
      @injector.shared
      class MyStateProvider extends StateProvider<MyState, MyAction> {
        constructor() {
          super(store);
        }
      }

      const provider = injector.resolve(MyStateProvider);
      const state = provider.getState();
      const unTyped: NotMyState<typeof state> = state as any;
      provider.dispatch(action);

      expect(provider).to.be.instanceOf(MyStateProvider);
      expect(state.foo).to.equal(0);
      expect(unTyped.doesNotExist).to.be.undefined;
      expect(() => provider.subscribe(() => {})).not.to.throw();
      expect(reducer).to.have.been.calledWith(state, action);
    });

  });

  describe('hook', () => {

    type State = {foo: 'bar'};
    type Target = {
      bar: string,
      cb: () => any,
      set(state: Partial<Target>),
      onFoo: Listeners<EventObject<Target>>
    };

    let state: State;
    let set: sinon.SinonSpy;
    let mappedState: Partial<Target>;
    let getState: () => State;
    let subscribe: sinon.SinonSpy;
    let stateProvider: StateProvider<State>;
    let target: Target;
    let stateMapper: (state: State) => Target;
    let dispatch: Dispatch<MyAction> & sinon.SinonSpy;
    let action: MyAction;
    let actionCreator: () => MyAction;
    let actionMapper: ActionMapper<Target, MyAction>;

    beforeEach(() => {
      state = {foo: 'bar'};
      action = {type: 'DO_BAR'};
      mappedState = {bar: 'baz'};
      getState = () => state;
      subscribe = spy();
      set = stub().callsFake(function(props) {Object.assign(this, props);});
      dispatch = spy();
      stateProvider = new StateProvider({getState, subscribe, dispatch});
      target = {set, bar: '', cb: null, onFoo: null};
      stateMapper = stub().returns(mappedState);
      actionCreator = stub().returns(action);
      actionMapper = spy(_dispatch => ({cb: () => _dispatch(actionCreator())}));
    });

    it('calls stateMapper with state', () => {
      StateProvider.hook({stateProvider, target, stateMapper});

      expect(stateMapper).to.have.been.calledOnceWith(state);
    });

    it('calls "set" of target immediately', () => {
      StateProvider.hook({stateProvider, target, stateMapper});

      expect(set).to.have.been.calledOnceWith(mappedState);
      expect(target.bar).to.equal('baz');
    });

    it('calls "set" of target on update', () => {
      StateProvider.hook({stateProvider, target, stateMapper});
      set.resetHistory();
      target.bar = '';
      subscribe.getCall(0).args[0]();

      expect(set).to.have.been.calledOnceWith(mappedState);
      expect(target.bar).to.equal('baz');
    });

    it('calls actionMapper with dispatch', () => {
      StateProvider.hook({stateProvider, target, actionMapper});

      expect(actionMapper).to.have.been.calledOnceWith(stateProvider.dispatch);
    });

    it('calls set with actionMapper returned callbacks', () => {
      StateProvider.hook({stateProvider, target, actionMapper});

      expect(set).to.have.been.calledOnce;
      expect(target.cb).to.be.instanceOf(Function);
    });

    it('hooks callbacks', () => {
      StateProvider.hook({stateProvider, target, actionMapper});

      target.cb();

      expect(actionCreator).to.have.been.calledOnce;
      expect(dispatch).to.have.been.calledOnceWith(action);
    });

    it('hooks callbacks (shorthand)', () => {
      StateProvider.hook<Target, State, MyAction>({
        stateProvider, target, actionMapper: {
          cb: actionCreator
        }});

      target.cb();

      expect(actionCreator).to.have.been.calledOnce;
      expect(dispatch).to.have.been.calledOnceWith(action);
    });

    it('registers actionMapper returned listeners', () => {
      type DoFooEvent = EventObject<Target> & {type: 'foo'};
      const evActionCreator: (ev: DoFooEvent) => MyAction = spy(ev => ev);
      const mapperWithListener = _dispatch =>({
        onFoo: (ev: EventObject<Target> & {type: 'foo'}) => _dispatch(evActionCreator(ev))
      });
      target.onFoo = new Listeners(target, 'foo');
      StateProvider.hook({stateProvider, target, actionMapper: mapperWithListener});

      target.onFoo.trigger();

      expect(set).not.to.have.been.called;
      expect(evActionCreator).to.have.been.calledOnce;
      expect(dispatch).to.have.been.calledOnce;
      expect(dispatch.args[0][0].type).to.equal('foo');
    });

    it('registers actionMapper returned listeners (shorthand', () => {
      type DoFooEvent = EventObject<Target> & {type: 'foo'};
      const evActionCreator: (ev: DoFooEvent) => MyAction = spy(ev => ev);
      const mapperWithListener = {
        onFoo: (ev: EventObject<Target> & {type: 'foo'}) => evActionCreator(ev)
      };
      target.onFoo = new Listeners(target, 'foo');
      StateProvider.hook({stateProvider, target, actionMapper: mapperWithListener});

      target.onFoo.trigger();

      expect(set).not.to.have.been.called;
      expect(evActionCreator).to.have.been.calledOnce;
      expect(dispatch).to.have.been.calledOnce;
      expect(dispatch.args[0][0].type).to.equal('foo');
    });

  });

});
