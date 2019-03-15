import { expect } from 'chai';
import 'tabris';
import { Composite, NativeObject } from 'tabris';
import { Page } from 'tabris';
import { Tab } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { restoreSandbox, stub } from './test';
import { ChangeEvent, ChangeListeners, event, ExtendedEvent } from '../src';
import { Listeners } from '../src';
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
    listener = stub();
    typedListener = stub();
  });

  afterEach(restoreSandbox);

  it('injects working Listeners', () => {
    class PlainClass {
      @event public readonly onMyEvent: Listeners<{}>;
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

  describe('in JSX', () => {

    beforeEach(() => {
      tabrisMock.reset();
    });

    it('ComponentJSX auto converts Listeners on composite to Listener in JSX', () => {
      class MyComponent extends Composite {
        @event public onMyEvent: Listeners<{foo: string}>;
        @event public onMyChangeEvent: ChangeListeners<string>;
        private jsxProperties: ComponentJSX<this>;
      }
      let event1: ExtendedEvent<{foo: string}>;
      let event2: ChangeEvent<string>;

      let myComponent: MyComponent
        = <MyComponent padding={10} onMyEvent={ev => event1 = ev} onMyChangeEvent={ev => event2 = ev}/>;
      myComponent.onMyEvent.trigger({foo: 'bar'});
      myComponent.onMyChangeEvent.trigger({value: 'bar'});

      expect(event1.foo).to.equal('bar');
      expect(event2.value).to.equal('bar');
    });

    it('ComponentJSX auto converts Listeners on page to Listener in JSX', () => {
      class MyComponent extends Page {
        @event public onMyEvent: Listeners<{foo: string}>;
        @event public onMyChangeEvent: ChangeListeners<string>;
        private jsxProperties: ComponentJSX<this>;
      }
      let event1: ExtendedEvent<{foo: string}>;
      let event2: ChangeEvent<string>;

      let myComponent: MyComponent
        = <MyComponent title='foo' onMyEvent={ev => event1 = ev} onMyChangeEvent={ev => event2 = ev} />;
      myComponent.onMyEvent.trigger({foo: 'bar'});
      myComponent.onMyChangeEvent.trigger({value: 'bar'});

      expect(event1.foo).to.equal('bar');
      expect(event2.value).to.equal('bar');
    });

    it('ComponentJSX auto converts Listeners on page to Listener in JSX', () => {
      class MyComponent extends Tab {
        @event public onMyEvent: Listeners<{foo: string}>;
        @event public onMyChangeEvent: ChangeListeners<string>;
        public jsxProperties: ComponentJSX<this>;
      }
      let event1: ExtendedEvent<{foo: string}>;
      let event2: ChangeEvent<string>;

      let myComponent: MyComponent
        = <MyComponent title='foo' onMyEvent={ev => event1 = ev} onMyChangeEvent={ev => event2 = ev}/>;
      myComponent.onMyEvent.trigger({foo: 'bar'});
      myComponent.onMyChangeEvent.trigger({value: 'bar'});

      expect(event1.foo).to.equal('bar');
      expect(event2.value).to.equal('bar');
    });

  });

});
