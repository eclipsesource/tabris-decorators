import 'mocha';
import 'sinon';
import {Composite, TextInput, TextView} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox} from './test';
import {component, connect, Injector, property, StateProvider} from '../src';
import {ExtendedJSX} from '../src/internals/ExtendedJSX';

interface RootState {
  stateString: string;
  stateNumber: number;
}

describe('connect', () => {

  let injector: Injector;
  let JSX: ExtendedJSX;
  let currentState: RootState;
  let stateProvider: StateProvider<RootState>;
  let subscribers: Array<() => void>;

  beforeEach(() => {
    tabris._init(new ClientMock());
    injector = new Injector();
    subscribers = [];
    JSX = injector.jsxProcessor;
    currentState = {
      stateString: 'bar',
      stateNumber: 23
    };
    stateProvider = {
      getState: () => currentState,
      subscribe: cb => subscribers.push(cb)
    };
    injector.addHandler(StateProvider, () => stateProvider);
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('as decorator', function() {

    let instance: CustomComponent;

    @connect<CustomComponent, RootState>(state => ({
      myText: state.stateString,
      myNumber: state.stateNumber
    }))
    class CustomComponent extends Composite {
      @property myText: string;
      @property myNumber: number;
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

    it('implies @component', () => {
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

  });

  describe('as function on component', function() {

    @component
    class CustomComponent extends Composite {
      @property myText: string;
      @property myNumber: number;
    }

    const ConnectedA = connect((state: RootState) => ({
      myText: state.stateString,
      myNumber: state.stateNumber
    }))(CustomComponent);

    const ConnectedB = connect<CustomComponent, RootState>(state => ({
      myText: state.stateString + '1',
      myNumber: state.stateNumber + 1
    }))(CustomComponent);

    let instance: CustomComponent;

    it('can not connect result again', () => {
      expect(() => connect(state => ({}))(ConnectedA)).to.throw(
        Error,
        'Could not apply "connect" to CustomComponent: Component is already connected'
      );
    });

    it('does not modify original', () => {
      instance = <CustomComponent myText='foo'/>;
      expect(instance.myText).to.equal('foo');
    });

    it('keeps @component behavior', () => {
      instance = <ConnectedA myText='foo'/>;
      instance.append(<TextView/>);
      expect(instance.children().length).to.equal(0);
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

    const Connected = connect((state: RootState) => ({
      text: state.stateString,
      selection: [state.stateNumber, state.stateNumber]
    }))(TextInput);

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

  });

});
