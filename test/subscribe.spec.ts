import 'mocha';
import 'sinon';
import { SinonSpy } from 'sinon';
import { ChangeListeners, Composite, Listeners, tabris, TextInput, TextView, WidgetCollection } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { expect, restoreSandbox, spy, stub } from './test';
import { property } from '../src';
import { subscribe } from '../src/internals/subscribe';
/* tslint:disable:no-unused-expression max-classes-per-file max-file-line-count no-empty*/

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
      sub.reset();
      widget.cornerRadius = 5;
      expect(sub).to.have.been.calledWith(5);
    });

    it('is not called after cancellation', () => {
      sub.reset();

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
      sub.reset();
      target.foo = 'baz';
      expect(sub).not.to.have.been.called;
    });

    it('is called with new value if ChangeListeners is set up correctly', () => {
      target.onFooChanged = new ChangeListeners(target, 'foo');
      subscribe(target, ['foo'], sub);
      sub.reset();

      target.foo = 'baz';
      target.onFooChanged.trigger({value: target.foo});

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is called with new value if Listeners is used correctly', () => {
      target.onFooChanged = new Listeners(target, 'fooChanged');
      subscribe(target, ['foo'], sub);
      sub.reset();

      target.foo = 'baz';
      target.onFooChanged.trigger({value: target.foo});

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is called with new value if trigger is called without parameter', () => {
      target.onFooChanged = new Listeners(target, 'fooChanged');
      subscribe(target, ['foo'], sub);
      sub.reset();

      target.foo = 'baz';
      target.onFooChanged.trigger();

      expect(sub).to.have.been.calledOnce;
      expect(sub).to.have.been.calledWith('baz');
    });

    it('is not called if trigger is called without value change', () => {
      target.onFooChanged = new Listeners(target, 'fooChanged');
      subscribe(target, ['foo'], sub);
      sub.reset();

      target.onFooChanged.trigger();

      expect(sub).not.to.have.been.called;
    });

    it('throws if Listeners is not set up with correct target', () => {
      target.onFooChanged = new Listeners({foo: 'bar'}, 'fooChanged');
      expect(() => subscribe(target, ['foo'], sub)).to.throw();
    });

    it('throws if Listeners is not set up with correct type', () => {
      target.onFooChanged = new Listeners(target, 'barChanged');
      expect(() => subscribe(target, ['foo'], sub)).to.throw();
    });

    it('is not called with new value if ChangeListeners is created later', () => {
      subscribe(target, ['foo'], sub);
      target.onFooChanged = new ChangeListeners(target, 'foo');
      sub.reset();

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
      @property public foo: number;
      @property(() => true)
      public b: any;
    }

    class ModelB {
      @property public bar: string;
      @property public a: ModelA;
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
        sub.reset();

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
        sub.reset();

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
        sub.reset();

        subTarget.bar = 'hello';

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('hello');
      });

      it('is called when sub-target is replaced', () => {
        sub.reset();

        const newSubTarget = new ModelB();
        newSubTarget.bar = 'world';
        target.b = newSubTarget;

        expect(sub).to.have.been.calledOnce;
        expect(sub).to.have.been.calledWith('world');
      });

      it('is called when sub-target is set', () => {
        sub.reset();
        target.b = null;

        target.b = subTarget;

        expect(sub).to.have.been.calledTwice;
        expect(sub).to.have.been.calledWith(undefined);
        expect(sub).to.have.been.calledWith('baz');
      });

      it('is called with undefined when sub-target is set to null', () => {
        sub.reset();

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
        sub.reset();

        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

      it('is not called after cancellation', () => {
        sub.reset();

        cancel();
        subTarget.bar = 'world';

        expect(sub).not.to.have.been.called;
      });

    });

  });

});
