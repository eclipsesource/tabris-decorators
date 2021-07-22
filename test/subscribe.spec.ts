import 'mocha';
import {SinonSpy} from 'sinon';
import {ChangeListeners, Composite, Listeners, ObservableData, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, spy} from './test';
import {prop, property} from '../src';
import {subscribe} from '../src/internals/subscribe';
import 'sinon';

describe('subscribe', () => {

  beforeEach(() => {
    tabris._init(new ClientMock());
  });

  describe('parameter check', () => {

    it('throws with falsy root', () => {
      expect(() => subscribe(undefined, ['foo', 'bar'], () => {})).to.throw();
      expect(() => subscribe(null, ['foo', 'bar'], () => {})).to.throw();
    });

    it('throws with falsy path', () => {
      expect(() => subscribe({}, undefined, () => {})).to.throw();
      expect(() => subscribe({}, null, () => {})).to.throw();
    });

    it('throws with path containing falsy entries', () => {
      expect(() => subscribe({}, [], () => {})).to.throw();
      expect(() => subscribe({}, [null], () => {})).to.throw();
      expect(() => subscribe({}, [undefined], () => {})).to.throw();
      expect(() => subscribe({}, ['foo', undefined], () => {})).to.throw();
      expect(() => subscribe({}, [''], () => {})).to.throw();
    });

    it('throws with falsy callback', () => {
      expect(() => subscribe({}, ['foo'], null)).to.throw();
      expect(() => subscribe({}, ['foo'], undefined)).to.throw();
    });

    it('does not throws with valid arguments', () => {
      expect(() => subscribe({}, ['foo'], () => {})).not.to.throw();
    });

  });

  describe('widget property subscriber', () => {

    let widget: Composite;
    let sub: SinonSpy;
    let cancel: () => void;

    beforeEach(() => {
      widget = new Composite();
      widget.cornerRadius = 10;
      sub = spy();
      cancel = subscribe(widget, ['cornerRadius'], sub);
    });

    it('is called initially with current value', () => {
      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith(10);
    });

    it('is called with new value', () => {
      sub.resetHistory();
      widget.cornerRadius = 5;
      expect(sub).to.have.been.calledWith(5);
    });

    it('is not called after cancellation', () => {
      sub.resetHistory();

      cancel();
      widget.cornerRadius = 5;

      expect(sub).not.to.have.been.called;
    });

  });

  describe('plain object property subscriber', () => {

    type Target = {foo: string, onFooChanged?: ChangeListeners<Target, 'foo'>};
    let target: Target;
    let sub: SinonSpy;

    beforeEach(() => {
      target = {foo: 'bar'};
      sub = spy();
    });

    it('is called initially with current value', () => {
      subscribe(target, ['foo'], sub);
      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('bar');
    });

    it('is not automatically called with new value', () => {
      subscribe(target, ['foo'], sub);
      sub.resetHistory();
      target.foo = 'baz';
      expect(sub).not.to.have.been.called;
    });

    it('is called with new value if ChangeListeners is set up correctly', () => {
      target.onFooChanged = new ChangeListeners(target, 'foo');
      subscribe(target, ['foo'], sub);
      sub.resetHistory();

      target.foo = 'baz';
      target.onFooChanged.trigger({value: target.foo});

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is called with new value if Listeners is used correctly', () => {
      target.onFooChanged = new ChangeListeners(target, 'foo');
      subscribe(target, ['foo'], sub);
      sub.resetHistory();

      target.foo = 'baz';
      target.onFooChanged.trigger({value: target.foo});

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is called with new value if trigger is called without parameter', () => {
      target.onFooChanged = new ChangeListeners(target, 'foo');
      subscribe(target, ['foo'], sub);
      sub.resetHistory();

      target.foo = 'baz';
      Listeners.getListenerStore(target).trigger('fooChanged');

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is not called if trigger is called without value change', () => {
      target.onFooChanged = new ChangeListeners(target, 'foo');
      subscribe(target, ['foo'], sub);
      sub.resetHistory();

      target.onFooChanged.trigger({value: target.foo});

      expect(sub).not.to.have.been.called;
    });

    it('throws if Listeners is not set up with correct target', () => {
      target.onFooChanged = new ChangeListeners({foo: 'bar'}, 'foo');
      expect(() => subscribe(target, ['foo'], sub)).to.throw();
    });

    it('throws if Listeners is not set up with correct type', () => {
      target.onFooChanged = new ChangeListeners(target, 'toString' as any) as any;
      expect(() => subscribe(target, ['foo'], sub)).to.throw();
    });

    it('is not called with new value if ChangeListeners is created later', () => {
      subscribe(target, ['foo'], sub);
      target.onFooChanged = new ChangeListeners(target, 'foo');
      sub.resetHistory();

      target.foo = 'baz';
      target.onFooChanged.trigger({value: target.foo});

      expect(sub).not.to.have.been.called;
    });

    it('is not given to non-Listeners function', () => {
      const notListeners = spy();
      target.onFooChanged = notListeners as any;

      subscribe(target, ['foo'], sub);

      expect(notListeners).not.to.have.been.called;
    });

  });

  describe('@property subscriber', () => {

    class ModelA {
      @property foo: number;
      @property(() => true)
      b: any;
    }

    class ModelB {
      @property bar: string;
      @property a: ModelA;
    }

    let target: ModelA;
    let sub: SinonSpy;
    let cancel: () => void;

    beforeEach(() => {
      target = new ModelA();
      sub = spy();
    });

    describe('subscribed to primitive type', () => {

      it('is called initially with current value', () => {
        target.foo = 1;

        subscribe(target, ['foo'], sub);

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(1);
      });

      it('is called with new value', () => {
        subscribe(target, ['foo'], sub);
        sub.resetHistory();

        target.foo = 2;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(2);
      });

      it('is called with undefined for non-existing property', () => {
        subscribe(target, ['baz'], sub);
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('is called with non-initialized property value', () => {
        subscribe(target, ['foo'], sub);
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('is not called after cancellation', () => {
        cancel = subscribe(target, ['foo'], sub);
        sub.resetHistory();

        cancel();
        target.foo = 2;

        expect(sub).not.to.have.been.called;
      });

    });

    describe('to nested target', () => {

      let subTarget: ModelB;

      beforeEach(() => {
        subTarget = new ModelB();
        subTarget.bar = 'baz';
        target.b = subTarget;
        cancel = subscribe(target, ['b', 'bar'], sub);
      });

      it('is called initially with current value', () => {
        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called when sub-target property changes', () => {
        sub.resetHistory();

        subTarget.bar = 'hello';

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('hello');
      });

      it('is called when sub-target is replaced', () => {
        sub.resetHistory();

        const newSubTarget = new ModelB();
        newSubTarget.bar = 'world';
        target.b = newSubTarget;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('world');
      });

      it('is called when sub-target is set', () => {
        sub.resetHistory();
        target.b = null;

        target.b = subTarget;

        expect(sub).to.have.been.calledTwice;
        expect(sub).to.have.been.calledWith(undefined);
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called with undefined when sub-target is set to null', () => {
        sub.resetHistory();

        target.b = null;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('throws when sub-target is set to non-object', () => {
        expect(() => target.b = 'foo').to.throw(
          TypeError,
          'Value of property "b" is of type string, expected object'
        );
      });

      it('is not called when previous sub-target property changes', () => {
        target.b = null;
        sub.resetHistory();

        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

      it('is not called after cancellation', () => {
        sub.resetHistory();

        cancel();
        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

    });

  });

  describe('@prop subscriber (observing property)', () => {

    class ModelA {
      @prop foo: number;
      @prop(Object)
      b: any;
    }

    class ModelB {
      @prop bar: string;
      @prop a: ModelA;
    }

    let target: ModelA;
    let sub: SinonSpy;
    let cancel: () => void;

    beforeEach(() => {
      target = new ModelA();
      sub = spy();
    });

    describe('to primitive type', () => {

      it('is called with new value', () => {
        subscribe(target, ['foo'], sub);
        sub.resetHistory();

        target.foo = 2;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(2);
      });

      it('is called with default property value', () => {
        subscribe(target, ['foo'], sub);
        expect(sub).to.have.been.calledWith(0);
      });

    });

    describe('to object type', () => {

      let b: ModelB;
      let a: ModelA;

      beforeEach(() => {
        b = new ModelB();
        b.bar = 'baz';
        target.b = b;
        a = b.a = new ModelA();
      });

      it('is called with initial value', () => {
        cancel = subscribe(target, ['b'], sub);
        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(b);
      });

      it('is not called multiple times with in-between object', () => {
        cancel = subscribe(target, ['b', 'a', 'foo'], sub);
        sub.resetHistory();

        b.a.foo = 23;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(23);
      });

      it('is called when nested object mutates', () => {
        cancel = subscribe(target, ['b'], sub);
        sub.resetHistory();

        b.bar = 'foo;';

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(b);
      });

    });

    describe('to nested target', () => {

      let subTarget: ModelB;

      beforeEach(() => {
        subTarget = new ModelB();
        subTarget.bar = 'baz';
        target.b = subTarget;
        cancel = subscribe(target, ['b', 'bar'], sub);
      });

      it('is called when sub-target property changes', () => {
        sub.resetHistory();

        subTarget.bar = 'hello';

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('hello');
      });

      it('is called when sub-target is replaced', () => {
        sub.resetHistory();

        const newSubTarget = new ModelB();
        newSubTarget.bar = 'world';
        target.b = newSubTarget;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('world');
      });

      it('is called when sub-target is set', () => {
        sub.resetHistory();
        target.b = null;

        target.b = subTarget;

        expect(sub).to.have.been.calledTwice;
        expect(sub).to.have.been.calledWith(undefined);
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called with undefined when sub-target is set to null', () => {
        sub.resetHistory();

        target.b = null;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('throws when sub-target is set to non-object', () => {
        expect(() => target.b = 'foo').to.throw(
          TypeError,
          'Value of property "b" is of type string, expected object'
        );
      });

    });

  });

  describe('ObservableData subscriber', () => {

    class ModelA extends ObservableData {
      foo: number;
      b: any;
    }

    class ModelB extends ObservableData {
      bar: string;
      a: ModelA;
    }

    let target: ModelA;
    let sub: SinonSpy;
    let cancel: () => void;

    beforeEach(() => {
      target = new ModelA();
      sub = spy();
    });

    describe('to primitive type', () => {

      it('is called initially with current value', () => {
        target.foo = 1;

        subscribe(target, ['foo'], sub);

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(1);
      });

      it('is called with new value', () => {
        subscribe(target, ['foo'], sub);
        sub.resetHistory();

        target.foo = 2;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(2);
      });

      it('is called with undefined for non-existing property', () => {
        subscribe(target, ['baz'], sub);
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('is called with non-initialized property value', () => {
        subscribe(target, ['foo'], sub);
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('is not called after cancellation', () => {
        cancel = subscribe(target, ['foo'], sub);
        sub.resetHistory();

        cancel();
        target.foo = 2;

        expect(sub).not.to.have.been.called;
      });

    });

    describe('to nested target', () => {

      let subTarget: ModelB;

      beforeEach(() => {
        subTarget = new ModelB();
        subTarget.bar = 'baz';
        target.b = subTarget;
        cancel = subscribe(target, ['b', 'bar'], sub);
      });

      it('is called initially with current value', () => {
        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called when sub-target property changes', () => {
        sub.resetHistory();

        subTarget.bar = 'hello';

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('hello');
      });

      it('is called when sub-target is replaced', () => {
        sub.resetHistory();

        const newSubTarget = new ModelB();
        newSubTarget.bar = 'world';
        target.b = newSubTarget;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('world');
      });

      it('is called when sub-target is set', () => {
        sub.resetHistory();
        target.b = null;

        target.b = subTarget;

        expect(sub).to.have.been.calledTwice;
        expect(sub).to.have.been.calledWith(undefined);
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called with undefined when sub-target is set to null', () => {
        sub.resetHistory();

        target.b = null;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith(undefined);
      });

      it('throws when sub-target is set to non-object', () => {
        expect(() => target.b = 'foo').to.throw(
          TypeError,
          'Value of property "b" is of type string, expected object'
        );
      });

      it('is not called when previous sub-target property changes', () => {
        target.b = null;
        sub.resetHistory();

        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

      it('is not called after cancellation', () => {
        sub.resetHistory();

        cancel();
        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

    });

  });

});
