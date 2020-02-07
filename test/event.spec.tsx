import {expect} from 'chai';
import {Listeners, NativeObject, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {restoreSandbox, stub} from './test';
import {event} from '../src';

describe('event', () => {

  interface MyEvent {
    type: string;
    target: object;
    foo?: string;
  }

  const PseudoNativeObject: new() => NativeObject = function() {} as any;
  PseudoNativeObject.prototype = NativeObject.prototype;

  let listener: () => void;
  let typedListener: (ev: MyEvent) => void;

  beforeEach(() => {
    tabris._init(new ClientMock());
    listener = stub();
    typedListener = stub();
  });

  afterEach(restoreSandbox);

  it('injects working Listeners', () => {
    class PlainClass {
      @event readonly onMyEvent: Listeners<{target: PlainClass}>;
    }

    const object = new PlainClass();
    object.onMyEvent(listener);
    object.onMyEvent.trigger({});

    expect(listener).to.have.been.calledOnce;
  });

  it('fails for other types', () => {
    expect(() => {
      class PlainClass {
        @event readonly onMyEvent: Date;
      }
    }).to.throw(/onMyEvent/);
  });

  it('synthesizes tabris events on NativeObjects', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event readonly onMyEvent: Listeners<{target: MyNativeObject}>;
    }

    const object = new MyNativeObject();
    object.on({myEvent: listener});
    object.onMyEvent.trigger({});

    expect(listener).to.have.been.calledOnce;
  });

  it('receives events on NativeObjects', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event readonly onMyEvent: Listeners<{target: MyNativeObject}>;
    }

    const object = new MyNativeObject();
    object.onMyEvent(listener);
    object.trigger('myEvent', {foo: 'bar'});

    expect(listener).to.have.been.calledOnce;
    expect(listener).to.have.been.calledWithMatch({foo: 'bar'});
  });

  it('forwards given event object to tabris event', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event readonly onMyEvent: Listeners<MyEvent>;
    }

    const object = new MyNativeObject();
    object.on({myEvent: typedListener});
    const eventData = {target: object, type: 'myEvent', foo: 'bar'};
    object.onMyEvent.trigger(eventData);

    expect(typedListener).to.have.been.calledWithMatch({target: object, type: 'myEvent', foo: 'bar'});
  });

  it('adjusts target and type on forwarded event', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event readonly onMyEvent: Listeners<MyEvent>;
    }

    const object = new MyNativeObject();
    object.on({myEvent: typedListener});
    const eventData = {target: new Date(), type: 'baz', foo: 'bar'};
    object.onMyEvent.trigger(eventData);

    expect(typedListener).to.have.been.calledWithMatch({target: object, type: 'myEvent', foo: 'bar'});
  });

  it('fails if property does not match pattern types', () => {
    expect(() => {
      class PlainClass {
        @event readonly onmyEvent: Listeners<{target: PlainClass}>;
      }
    }).to.throw(/onmyEvent/);
    expect(() => {
      class PlainClass {
        @event readonly MyEvent: Listeners<{target: PlainClass}>;
      }
    }).to.throw(/MyEvent/);
    expect(() => {
      class PlainClass {
        @event readonly myEvent: Listeners<{target: PlainClass}>;
      }
    }).to.throw(/myEvent/);
  });

});
