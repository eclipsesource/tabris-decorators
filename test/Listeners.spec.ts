import { fail } from 'assert';
import { expect } from 'chai';
import { match } from 'sinon';
import 'tabris';
import { EventObject } from 'tabris';
import { restoreSandbox, spy, stub } from './test';
import { Listeners } from '../src';
// tslint:disable:no-unused-expression max-file-line-count

describe('ListenerCollection', () => {

  interface MyEvent {
    foo: string;
  }

  const type = 'myEventType';
  const target = new Object();

  let voidListeners: Listeners;
  let myEventListeners: Listeners<MyEvent>;
  let listener: () => void;
  let myEventListener: (ev: MyEvent) => void;

  beforeEach(() => {
    voidListeners = new Listeners(target, type);
    myEventListeners = new Listeners(target, type);
    listener = stub();
    myEventListener = stub();
  });

  afterEach(restoreSandbox);

  it('exposes target and type', () => {
    expect(myEventListeners.type).to.equal(type);
    expect(myEventListeners.target).to.equal(target);
  });

  it('notifies directly registered listener', () => {
    voidListeners.addListener(listener);

    voidListeners.trigger();

    expect(listener).to.have.been.called;
  });

  it('notifies directly registered typed listener', () => {
    myEventListeners.addListener(myEventListener);

    myEventListeners.trigger({foo: 'bar'});

    expect(myEventListener).to.have.been.calledWithMatch({foo: 'bar'});
  });

  it('initializes event object with type, timeStamp and target', () => {
    myEventListeners.addListener(myEventListener);

    myEventListeners.trigger({foo: 'bar'});

    expect(myEventListener).to.have.been.calledWithMatch({foo: 'bar', target, type, timeStamp: match.number});
  });

  it('ignores type, timeStamp and target in event data', () => {
    myEventListeners.addListener(myEventListener);

    (myEventListeners as any).trigger({foo: 'bar', target: null, type: null, timeStamp: null});

    expect(myEventListener).to.have.been.calledWithMatch({foo: 'bar', target, type, timeStamp: match.number});
  });

  it('passes through uninitialized EventObject', () => {
    myEventListeners.addListener(myEventListener);
    let ev = Object.assign(new EventObject(), {foo: 'bar'});

    myEventListeners.trigger(ev);

    expect(myEventListener).to.have.been.calledWith(ev);
  });

  it('copies initialized EventObject', () => {
    let ev = Object.assign(new EventObject(), {foo: 'bar'});
    let events: Array<MyEvent & EventObject<{}>> = [];
    myEventListeners.addListener(event => events.push(event));

    myEventListeners.trigger(ev);
    myEventListeners.trigger(events[0]);

    expect(events.length).to.equal(2);
    expect(ev).to.equal(events[0]);
    expect(events[0]).not.to.equal(events[1]);
    expect(events[1].foo).to.equal('bar');
  });

  it('notifies listener with unbound trigger', () => {
    voidListeners.addListener(listener);
    let trigger = voidListeners.trigger;

    trigger();

    expect(listener).to.have.been.called;
  });

  it('notifies shorthand registered listener', () => {
    voidListeners(listener);

    voidListeners.trigger();

    expect(listener).to.have.been.called;
  });

  it('notifies typed shorthand registered listener', () => {
    myEventListeners(myEventListener);

    myEventListeners.trigger({foo: 'bar'});

    expect(myEventListener).to.have.been.calledWithMatch({foo: 'bar'});
  });

  it('notifies listener only once', () => {
    voidListeners(listener);
    voidListeners(listener);

    voidListeners.trigger();

    expect(listener).to.have.been.calledOnce;
  });

  it('does not notify removed listener', () => {
    voidListeners(listener);
    voidListeners.removeListener(listener);

    voidListeners.trigger();

    expect(listener).not.to.have.been.called;
  });

  it('notifies listeners once ', async () => {
    voidListeners.once(listener);

    voidListeners.trigger();
    voidListeners.trigger();

    expect(listener).to.have.been.calledOnce;
  });

  it('resolves previous promises', async () => {
    let promise1 = voidListeners.resolve();
    let promise2 = voidListeners.resolve();

    voidListeners.trigger();

    expect(await promise1).to.be.instanceof(EventObject);
    expect(await promise2).to.be.instanceof(EventObject);
  });

  it('resolves previous typed promises', async () => {
    let promise1 = myEventListeners.resolve();
    let promise2 = myEventListeners.resolve();

    myEventListeners.trigger({foo: 'bar'});

    expect(await promise1).to.be.instanceof(EventObject);
    expect(await promise2).to.be.instanceof(EventObject);
    expect(await promise1).contains({foo: 'bar'});
    expect(await promise2).contains({foo: 'bar'});
  });

  it('resolves promises with pre-defined value', async () => {
    let promise: Promise<string> = myEventListeners.resolve('foo');

    myEventListeners.trigger({foo: 'bar'});

    expect(await promise).to.equal('foo');
  });

  it('resolves promises with pre-defined falsy value', async () => {
    let promise: Promise<boolean> = myEventListeners.resolve(false);

    myEventListeners.trigger({foo: 'bar'});

    expect(await promise).to.equal(false);
  });

  it('rejects promises with pre-defined error value', async () => {
    let value = new Error('foo');
    let promise: Promise<string> = myEventListeners.reject(value);

    myEventListeners.trigger({foo: 'bar'});

    let result;
    try {
      await promise;
      fail('Promise should not resolve');
    } catch (ex) {
      result = ex;
    }
    expect(result).to.be.instanceof(Error);
    expect(result.message).to.equal('foo');
  });

  it('rejects promises with instance of given Error class', async () => {
    class CustomError extends Error {
      constructor() {
        super('foo');
      }
    }
    let promise: Promise<string> = myEventListeners.reject(CustomError);

    myEventListeners.trigger({foo: 'bar'});

    let result;
    try {
      await promise;
      fail('Promise should not resolve');
    } catch (ex) {
      result = ex;
    }

    expect(result).to.be.instanceof(Error);
    expect(result.message).to.equal('foo');
  });

  it('rejects promises with given string value as error message', async () => {
    let promise: Promise<string> = myEventListeners.reject('foo');

    myEventListeners.trigger({foo: 'bar'});

    let result;
    try {
      await promise;
      fail('Promise should not resolve');
    } catch (ex) {
      result = ex;
    }

    expect(result).to.be.instanceof(Error);
    expect(result.message).to.equal('foo');
  });

  it('rejects promises with given object merged in to error', async () => {
    let promise: Promise<string> = myEventListeners.reject({foo2: 'bar2'});

    myEventListeners.trigger({foo: 'bar'});

    let result;
    try {
      await promise;
      fail('Promise should not resolve');
    } catch (ex) {
      result = ex;
    }

    expect(result).to.be.instanceof(Error);
    expect(result.message).to.equal('myEventType fired');
    expect(result.foo2).to.equal('bar2');
  });

  it('rejects promises with Error/Event merge', async () => {
    let promise: Promise<string> = myEventListeners.reject();

    myEventListeners.trigger({foo: 'bar'});

    let result;
    try {
      await promise;
      fail('Promise should not resolve');
    } catch (ex) {
      result = ex;
    }

    expect(result).to.be.instanceof(Error);
    expect(result.message).to.equal('myEventType fired');
    expect(result.foo).to.equal('bar');
  });

  it('does not resolve new promise', done => {
    myEventListeners.trigger({foo: 'bar'});

    myEventListeners.resolve().then(
      () => fail('Should not resolve'),
      () => fail('Should not reject')
    );

    setTimeout(done, 100);
  });

  it('prints error of async listeners', done => {
    async function asyncListener() {
      return Promise.reject('someError');
    }
    let errorSpy = spy(console, 'error');
    voidListeners(asyncListener);

    voidListeners.trigger();

    setTimeout(() => {
      errorSpy.restore();
      expect(errorSpy).to.have.been.calledWith('someError');
      done();
    }, 100);
  });

});
