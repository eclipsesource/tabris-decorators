import 'mocha';
import 'sinon';
import {Composite, TextView} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox} from './test';
import {component, connect, Injector, StateProvider} from '../src';

/**
 * @typedef RootState
 * @property {string} stateString
 * @property {number} stateNumber
*/

/** @class */
class CustomComponent extends Composite {

  /**
   * @param {tabris.Properties<CustomComponent>} properties
   */
  constructor(properties) {
    super();
    this.myText = '';
    this.myNumber = 0;
    this.set(properties);
  }

}

describe('connect', () => {

  /** @type {Injector} */
  let injector;

  /** @type {RootState} */
  let currentState;

  /** @type {StateProvider<RootState>} */
  let stateProvider;

  /** @type {Array<() => void>} */
  let subscribers;

  /** @type {CustomComponent} */
  let instance;

  beforeEach(() => {
    tabris._init(new ClientMock());
    injector = new Injector();
    subscribers = [];
    currentState = {
      stateString: 'bar',
      stateNumber: 23
    };
    stateProvider = {
      getState: () => currentState,
      subscribe: cb => subscribers.push(cb)
    };
    injector.addHandler(StateProvider, () => stateProvider);
    instance = injector.create(ConnectedComponent, {myText: 'foo'});
  });

  afterEach(() => {
    restoreSandbox();
  });

  const ConnectedComponent = connect(
    /**
     * @param {RootState} state
     * @returns {tabris.Properties<CustomComponent>}
     **/
    state => ({
      myText: state.stateString,
      myNumber: state.stateNumber
    })
  )(CustomComponent);

  it('can not connect twice', () => {
    expect(() => connect(state => ({}))(ConnectedComponent)).to.throw(
      Error,
      'Could not apply "connect" to CustomComponent: Component is already connected'
    );
  });

  it('implies @component', () => {
    instance.append(new TextView());
    expect(instance.children().length).to.equal(0);
  });

  it('maps state on state change', () => {
    currentState.stateString = 'baz';
    subscribers.forEach(cb => cb());
    expect(instance.myText).to.equal('baz');
  });

  it('injector maybe passed by argument', () => {
    instance = new ConnectedComponent({myText: 'foo'}, injector);

    currentState.stateString = 'baz';
    subscribers.forEach(cb => cb());
    expect(instance.myText).to.equal('baz');
  });

  it('fails when falling back to default injector', () => {
    expect(() => new ConnectedComponent({myText: 'foo'})).to.throw(
      Error,
      'no compatible injection handler exists for this type'
    );
  });

});
