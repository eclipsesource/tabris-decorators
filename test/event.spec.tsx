import {expect} from 'chai';
import {ChangeListeners, Listeners, NativeObject, Observable, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {restoreSandbox, stub} from './test';
import {event, property} from '../src';

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

  it('injects working ChangeListeners', () => {
    class PlainClass {
      @event readonly onFooChanged: ChangeListeners<PlainClass, 'foo'>;
      @property foo: string;
    }

    const object = new PlainClass();
    object.onFooChanged(listener);
    object.foo = 'bar';

    expect(object.onFooChanged.values).to.be.instanceOf(Observable);
    expect(listener).to.have.been.calledOnce;
  });

  it('fails for incompatible types', () => {
    expect(() => {
      class PlainClass {
        @event readonly onMyEvent: Date;
      }
    }).to.throw(/onMyEvent/);
  });

  it('accepts missing type', () => {
    expect(() => {
      class PlainClass {
        readonly onMyEvent;
      }
      event(PlainClass.prototype, 'onMyEvent');
    }).not.to.throw();
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
    expect(() => {
      class PlainClass {
        @event readonly onFoo: ChangeListeners<PlainClass, 'foo'>;
        @property foo: string;
      }
    }).to.throw(/onFoo/);
    expect(() => {
      class PlainClass {
        @event readonly onBarChanged: ChangeListeners<PlainClass, 'foo'>;
        @property foo: string;
      }
      new PlainClass().onBarChanged(() => {});
    }).to.throw(/has no property "bar"/);
  });

});
