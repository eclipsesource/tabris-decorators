import { expect } from 'chai';
import { Listeners, NativeObject, tabris } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { restoreSandbox, stub } from './test';
import { event } from '../src';
// tslint:disable:no-unused-expression

describe('event', () => {

  interface MyEvent {
    type: string;
    target: object;
    foo?: string;
  }

  // tslint:disable-next-line:variable-name only-arrow-functions no-empty no-any
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
      @event public readonly onMyEvent: Listeners<{target: PlainClass}>;
    }

    let object = new PlainClass();
    object.onMyEvent(listener);
    object.onMyEvent.trigger({});

    expect(listener).to.have.been.calledOnce;
  });

  it('fails for other types', () => {
    expect(() => {
      // tslint:disable-next-line:no-unused-variable
      class PlainClass {
        @event public readonly onMyEvent: Date;
      }
    }).to.throw(/onMyEvent/);
  });

  it('synthesizes tabris events on NativeObjects', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event public readonly onMyEvent: Listeners<{}>;
    }

    let object = new MyNativeObject();
    object.on({myEvent: listener});
    object.onMyEvent.trigger({});

    expect(listener).to.have.been.calledOnce;
  });

  it('receives events on NativeObjects', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event public readonly onMyEvent: Listeners<{}>;
    }

    let object = new MyNativeObject();
    object.onMyEvent(listener);
    object.trigger('myEvent', {foo: 'bar'});

    expect(listener).to.have.been.calledOnce;
    expect(listener).to.have.been.calledWithMatch({foo: 'bar'});
  });

  it('forwards given event object to tabris event', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event public readonly onMyEvent: Listeners<MyEvent>;
    }

    let object = new MyNativeObject();
    object.on({myEvent: typedListener});
    let eventData = {target: object, type: 'myEvent', foo: 'bar'};
    object.onMyEvent.trigger(eventData);

    expect(typedListener).to.have.been.calledWithMatch({target: object, type: 'myEvent', foo: 'bar'});
  });

  it('adjusts target and type on forwarded event', () => {
    class MyNativeObject extends PseudoNativeObject {
      @event public readonly onMyEvent: Listeners<MyEvent>;
    }

    let object = new MyNativeObject();
    object.on({myEvent: typedListener});
    let eventData = {target: new Date(), type: 'baz', foo: 'bar'};
    object.onMyEvent.trigger(eventData);

    expect(typedListener).to.have.been.calledWithMatch({target: object, type: 'myEvent', foo: 'bar'});
  });

  it('fails if property does not match pattern types', () => {
    expect(() => {
      // tslint:disable-next-line:no-unused-variable
      class PlainClass {
        @event public readonly onmyEvent: Listeners<{}>;
      }
    }).to.throw(/onmyEvent/);
    expect(() => {
      // tslint:disable-next-line:no-unused-variable
      class PlainClass {
        // tslint:disable-next-line:variable-name
        @event public readonly MyEvent: Listeners<{}>;
      }
    }).to.throw(/MyEvent/);
    expect(() => {
      // tslint:disable-next-line:no-unused-variable
      class PlainClass {
        @event public readonly myEvent: Listeners<{}>;
      }
    }).to.throw(/myEvent/);
  });

});
