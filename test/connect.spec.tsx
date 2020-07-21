import 'mocha';
import 'sinon';
import {
  asFactory,
  Attributes,
  CallableConstructor,
  Composite,
  Listeners,
  ProgressBar,
  Properties,
  Set,
  tabris,
  TextInput,
  TextView
} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox} from './test';
import {ActionMapper, component, connect, event, Injector, injector as orgInjector, property, StateMapper, StateProvider} from '../src';
import {ExtendedJSX} from '../src/internals/ExtendedJSX';
const orgComponentKey: unique symbol = tabris.symbols.originalComponent as any;

interface RootState {
  stateString: string;
  stateNumber: number;
}

type Action = {type: 'foo' | 'bar'};

describe('connect', () => {

  let injector: Injector;
  let JSX: ExtendedJSX;
  let currentState: RootState;
  let stateProvider: StateProvider<RootState, Action>;
  let subscribers: Array<() => void>;
  let actions: Action[];

  beforeEach(() => {
    tabris._init(new ClientMock());
    // eslint-disable-next-line no-undef
    window.JSX.install(new ExtendedJSX(orgInjector));
    injector = new Injector();
    subscribers = [];
    actions = [];
    JSX = injector.jsxProcessor;
    currentState = {
      stateString: 'bar',
      stateNumber: 23
    };
    stateProvider = {
      getState: () => currentState,
      subscribe: cb => subscribers.push(cb),
      dispatch: action => {actions.push(action); return action;}
    };
    injector.addHandler(StateProvider, () => stateProvider);
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('as decorator', function() {

    let instance: CustomComponent;

    @component
    @connect<CustomComponent, RootState, Action>(
      state => ({
        myText: state.stateString,
        myNumber: state.stateNumber
      }),
      dispatch => ({
        callback: (type: 'foo' | 'bar') => dispatch({type})
      })
    )
    class CustomComponent extends Composite {
      @property myText: string;
      @property myNumber: number;
      @property callback: (type: string) => any;
    }

    beforeEach(() => {
      instance = <CustomComponent myText='foo'/>;
    });

    it('can not connect twice', () => {
      expect(() => connect(state => ({}))(CustomComponent)).to.throw(
        Error,
        'Could not apply "connect" to CustomComponent: Component is already connected'
      );
    });

    it('can be combined with @component before @connect', () => {
      instance.append(<TextView/>);
      expect(instance.children().length).to.equal(0);
    });

    it('can be combined with @component after @connect', () => {
      @connect<CustomComponent2, RootState, Action>(
        state => ({myText: state.stateString}),
        dispatch => ({callback: (type: 'foo' | 'bar') => dispatch({type})})
      )
      @component
      class CustomComponent2 extends Composite {
        @property myText: string;
        @property callback: (type: string) => any;
      }
      instance = <CustomComponent2/>;
      instance.append(<TextView/>);
      expect(instance.children().length).to.equal(0);
    });

    it('maps state on creation', () => {
      expect(instance.myText).to.equal('bar');
    });

    it('maps state on state change', () => {
      currentState.stateString = 'baz';
      subscribers.forEach(cb => cb());
      expect(instance.myText).to.equal('baz');
    });

    it('maps action dispatcher to callback on creation', () => {
      instance.callback('foo');

      expect(actions).to.deep.equal([{type: 'foo'}]);
    });

    it('maps action creator to callback on creation', () => {
      @connect<CustomComponent2, RootState, Action>(
        null,
        {callback: (type: 'foo' | 'bar') => ({type})}
      )
      @component
      class CustomComponent2 extends Composite {
        @property callback: (type: string) => any;
      }

      (<CustomComponent2/> as CustomComponent2).callback('foo');

      expect(actions).to.deep.equal([{type: 'foo'}]);
    });

    it('maps action dispatcher to event on creation', () => {
      @connect<CustomComponent2, RootState, Action>(
        null,
        dispatch => ({onCallback: ev => dispatch({type: ev.payload})})
      )
      @component
      class CustomComponent2 extends Composite {
        @event onCallback: Listeners<{target: CustomComponent2, payload: 'foo' | 'bar'}>;
      }

      (<CustomComponent2/> as CustomComponent2).onCallback.trigger({payload: 'foo'});

      expect(actions).to.deep.equal([{type: 'foo'}]);
    });

    it('maps action creator to event on creation', () => {
      @connect<CustomComponent2, RootState, Action>(
        null,
        {onCallback: ev => ({type: ev.payload})}
      )
      @component
      class CustomComponent2 extends Composite {
        @event onCallback: Listeners<{target: CustomComponent2, payload: 'foo' | 'bar'}>;
      }

      (<CustomComponent2/> as CustomComponent2).onCallback.trigger({payload: 'foo'});

      expect(actions).to.deep.equal([{type: 'foo'}]);
    });

  });

  describe('as function on component', function() {

    class CustomComponentImpl extends Composite {
      @property myText: string;
      @property myNumber: number;
    }

    type CustomComponent = CustomComponentImpl;
    let CustomComponent: CallableConstructor<typeof CustomComponentImpl>;
    let ConnectedA: CallableConstructor<typeof CustomComponentImpl>;
    let ConnectedB: CallableConstructor<typeof CustomComponentImpl>;

    beforeEach(() => {
      CustomComponent = component({factory: true, injector})(CustomComponentImpl);

      ConnectedA = connect((state: RootState) => ({
        myText: state.stateString,
        myNumber: state.stateNumber
      }))(CustomComponent);

      ConnectedB = connect<CustomComponent, RootState>(state => ({
        myText: state.stateString + '1',
        myNumber: state.stateNumber + 1
      }))(CustomComponent);
    });

    let instance: CustomComponent;

    it('can not connect result again', () => {
      expect(() => connect(state => ({}))(ConnectedA)).to.throw(
        Error,
        'Could not apply "connect" to CustomComponentImpl: Component is already connected'
      );
    });

    it('does not modify original', () => {
      instance = <CustomComponent myText='foo'/>;
      expect(instance.myText).to.equal('foo');
    });

    it('keeps @component behavior', () => {
      instance = ConnectedA({myText: 'foo'});
      instance.append(<TextView/>);
      expect(instance.children().length).to.equal(0);
    });

    it('does not allow connected component to be made a factory afterwards', () => {
      const connected = connect(() => ({myText: ''}))(CustomComponentImpl);
      expect(() => asFactory(connected)).to.throw(Error);
      expect(() => component({factory: true})(connected)).to.throw(Error);
    });

    it('maps state on creation', () => {
      instance = <ConnectedA myText='foo'/>;
      expect(instance.myText).to.equal('bar');
    });

    it('maps state on state change', () => {
      instance = <ConnectedA myText='foo'/>;
      currentState.stateString = 'baz';
      subscribers.forEach(cb => cb());
      expect(instance.myText).to.equal('baz');
    });

    it('original can be connected again', () => {
      instance = <ConnectedB myText='foo'/>;
      expect(instance.myText).to.equal('bar1');
    });

  });

  describe('as function on built-in widget', function() {

    const Connected = connect<TextInput, RootState, Action>(
      state => ({
        text: state.stateString,
        selection: [state.stateNumber, state.stateNumber]
      }),
      dispatch => ({
        onInput: ev => dispatch({type: ev.text === 'foo' ? 'foo' : 'bar'})
      })
    )(TextInput);

    let instance: TextInput;

    it('can not connect result again', () => {
      expect(() => connect(state => ({}))(Connected)).to.throw(
        Error,
        'Could not apply "connect" to TextInput: Component is already connected'
      );
    });

    it('does not modify original', () => {
      instance = <TextInput text='foo'/>;
      expect(instance.text).to.equal('foo');
    });

    it('maps state on creation', () => {
      instance = <Connected text='foo'/>;
      expect(instance.text).to.equal('bar');
    });

    it('maps state on state change', () => {
      instance = <Connected text='foo'/>;
      currentState.stateString = 'baz';
      subscribers.forEach(cb => cb());
      expect(instance.text).to.equal('baz');
    });

    it('maps actions on creation', () => {
      instance.onInput.trigger({text: 'bar'});

      expect(actions).to.deep.equal([{type: 'bar'}]);
    });
  });

  describe('as function on childless functional component', function() {

    let CustomComponent: (attributes?: Attributes<TextInput>, injector?: Injector) => TextInput;
    let instance: TextInput;

    beforeEach(() => {
      CustomComponent = connect<typeof CustomComponent, RootState, Action>(
        state => ({
          text: state.stateString,
          maxChars: state.stateNumber
        }),
        dispatch => ({
          onAccept: ({text}) => dispatch({type: text})
        })
      ) (
        attr => <TextInput background='blue' {...attr}/>
      );
      instance = CustomComponent({}, injector);
    });

    it('can not connect result again', () => {
      expect(() => connect(() => ({}))(CustomComponent)).to.throw(
        Error,
        'Could not apply "connect" to component: Component is already connected'
      );
    });

    it('maps state on creation', () => {
      expect(instance.text).to.equal('bar');
    });

    it('maps state on state change', () => {
      currentState.stateString = 'baz';

      subscribers.forEach(cb => cb());
      expect(instance.text).to.equal('baz');
    });

    it('maps actions on creation', () => {
      instance.onAccept.trigger({text: 'foo'});

      expect(actions).to.deep.equal([{type: 'foo'}]);
    });

  });

  describe('as function with "apply" on functional component', function() {

    let CustomComponent: (attributes?: Attributes<Composite>, injector?: Injector) => Composite;
    let Connected: typeof CustomComponent;
    let instance: Composite;
    let stateMapper: StateMapper<Properties<Composite>, RootState>;
    let actionMapper: ActionMapper<Composite, Action>;

    beforeEach(() => {
      stateMapper = state => ({
        apply: {
          '#foo': Set(TextInput, {text: state.stateString}),
          '.bar': Set(ProgressBar, {selection: state.stateNumber})
        }
      });
      actionMapper = dispatch => ({
        apply: {
          '#foo': Set(TextInput, {
            onAccept: ({text}) => dispatch({type: text === 'foo' ? text : 'bar'})
          }),
          '.bar': Set(ProgressBar, {data: () => 'baz'})
        }
      });
      CustomComponent = (attr: Attributes<Composite>) => (
        <Composite {...attr}>
          <TextInput id='foo'/>
          <ProgressBar class='bar'/>
        </Composite>
      );
    });

    it('throws for invalid apply return type', () => {
      Connected = connect<Composite>(() => ({apply: 23}) as any)(CustomComponent);
      expect(() => Connected({}, injector)).to.throw(TypeError);
    });

    it('applies rules on creation', () => {
      Connected = connect<Composite>(stateMapper)(CustomComponent);

      instance = Connected({}, injector);

      expect(instance.find(TextInput).only().text).to.equal('bar');
      expect(instance.find(ProgressBar).only().selection).to.equal(23);
    });

    it('applies rules on state change', () => {
      Connected = connect<Composite>(stateMapper)(CustomComponent);
      instance = Connected({}, injector);

      currentState.stateString = 'baz';
      currentState.stateNumber = 24;
      subscribers.forEach(cb => cb());

      expect(instance.find(TextInput).only().text).to.equal('baz');
      expect(instance.find(ProgressBar).only().selection).to.equal(24);
    });

    it('applies rules in strict mode', () => {
      Connected = connect<Composite>(
        () => ({apply: {'#baz': {text: 'foo'}}})
      )(CustomComponent);
      expect(() => Connected({}, injector)).to.throw(Error, /match/);
    });

    it('applies action dispatcher to events and callbacks on creation', () => {
      Connected = connect<Composite, {}, Action>(null, actionMapper)(CustomComponent);

      instance = Connected({}, injector);
      instance.find(TextInput).trigger('accept', {text: 'foo'});

      expect(actions).to.deep.equal([{type: 'foo'}]);
      expect(instance.find(ProgressBar).only().data.call()).to.equal('baz');
    });

    it('applies action creator to events and callbacks on creation', () => {
      actionMapper = {
        apply: {
          '#foo': Set(TextInput, {
            onAccept: ({text}) => ({type: text === 'foo' ? text : 'bar'})
          }),
          '.bar': Set(ProgressBar, {data: () => ({type: 'foo'})})
        }
      };
      Connected = connect<Composite, {}, Action>(null, actionMapper)(CustomComponent);

      instance = Connected({}, injector);
      instance.find(TextInput).trigger('accept', {text: 'bar'});
      instance.find(ProgressBar).only().data.call();

      expect(actions).to.deep.equal([{type: 'bar'}, {type: 'foo'}]);
    });

  });

});
