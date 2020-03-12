import 'mocha';
import 'sinon';
import {useFakeTimers} from 'sinon';
import {Composite, tabris, TextInput, LayoutData} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy, stub} from './test';
import {bind, component, property, injector} from '../src';

@component class CustomComponent extends Composite {

  /** @type {string} */
  @bind({path: '#textInput1.text', type: String})
  myText;

  @bind({
    path: '#textInput1.layoutData',
    typeGuard: value => value.width !== 23
  })
  myObject;

}

@component class ComponentWithInitialValue extends Composite {

  /** @type {string} */
  @bind({path: '#foo.text', type: String})
  foo = 'foo';
}

@component class ComponentWithTypeGuard extends Composite {
  /** @type {string | number} */
  @bind({
    path: '#foo.bar',
    typeGuard: v => (typeof v === 'string') || v === undefined
  })
  value;
}

class MyItem {
  /** @type {string} */
  @property foo;
}

describe('component', () => {

  beforeEach(() => {
    injector.jsxProcessor.unsafeBindings = 'error';
    tabris._init(new ClientMock());
  });

  afterEach(() => {
    injector.jsxProcessor.unsafeBindings = 'error';
    restoreSandbox();
  });

  describe('@bind({path, type})', () => {

    /** @type {CustomComponent} */
    let widget;

    /** @type {TextInput} */
    let textInput1;

    beforeEach(() => {
      widget = new CustomComponent();
      textInput1 = new TextInput({id: 'textInput1', text: 'foo'});
    });

    it('returns the target property value', () => {
      widget.append(textInput1);

      expect(widget.myText).to.equal('foo');
    });

    it('returns the changed target property value', () => {
      widget.append(textInput1);

      textInput1.text = 'bar';

      expect(widget.myText).to.equal('bar');
    });

    it('ignores detaching the target', () => {
      widget.append(textInput1);

      textInput1.detach();
      textInput1.text = 'bar';

      expect(widget.myText).to.equal('bar');
    });

    it('value stays after disposing the target', () => {
      widget.append(textInput1);

      textInput1.dispose();

      expect(widget.myText).to.equal('foo');
    });

    describe('on a Widget that is not a @component', () => {

      let clock;
      let now;

      beforeEach(() => {
        now = Date.now();
        clock = useFakeTimers(now);
      });

      afterEach(() => {
        clock.restore();
      });

      it('prints an error', () => {
        spy(console, 'error');
        class FailedComponent extends Composite {
          /** @type {string} */
          @bind({
            path: '#textInput1.text',
            typeGuard: str => typeof str === 'string'
          })
          myText;
        }
        clock.tick(now + 100);
        expect(console.error).to.have.been.calledWith(
          'Binding "myText" <-> "#textInput1.text" failed to initialize: FailedComponent is not a @component'
        );
      });

    });

    it('fails to decorate with invalid binding path', () => {
      /** @type {Object.<string, string>} */
      const badPaths = {
        'foo.bar': 'Binding path needs to start with "#".',
        '#foo.bar.baz': 'Binding path has too many segments.',
        '#foo': 'Binding path needs at least two segments.',
        '#fo o.bar': 'Binding path contains invalid characters.',
        '#foo.bar[]': 'Binding path contains invalid characters.',
        '#foo.bar<>': 'Binding path contains invalid characters.'
      };
      for (const path in badPaths) {
        expect(() => {
          @component class FailedComponent extends Composite {
            /** @type {string} */
            @bind({
              path,
              type: String
            }) value;
          }
        }).to.throw('Could not apply decorator "bind" to "value": ' + badPaths[path]);
      }
    });

    it('allows to initialize base property on declaration', () => {
      const component2 = new ComponentWithInitialValue();

      expect(component2.foo).to.equal('foo');
    });

    it('allows to change base property before first append', () => {
      const component2 = new ComponentWithInitialValue();
      const listener = stub();
      component2.on('fooChanged', listener);

      component2.foo = 'bar';

      expect(component2.foo).to.equal('bar');
      expect(listener).to.have.been.calledWithMatch({
        target: component2, value: 'bar', type: 'fooChanged'
      });
    });

    it('throws if a binding target can not be resolved after first append', () => {
      expect(() => widget.append(new TextInput({id: 'textInput2'}))).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
        + 'No widget matching "#textInput1" was appended.'
      );
    });

    it('throws if binding to missing property', () => {
      expect(() => widget.append(new Composite({id: 'textInput1'}))).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
        + 'Target does not have a property "text".'
      );
    });

    it('throws if binding to wrong value type', () => {
      const target = new Composite({id: 'textInput1'});
      Object.defineProperty(target, 'text', {
        set: () => undefined,
        get: () => 23
      });
      expect(() => widget.append(target)).to.throw(
        'Failed to set property "myText": Expected value "23" to be of type string, but found number.'
      );
    });

    it('throws if binding to value failing type guard', () => {
      const target = new TextInput({id: 'textInput1', width: 23});
      expect(() => widget.append(target)).to.throw(
        Error,
        /Type guard check failed/
      );
    });

    it('throws if binding to unknown type without type guard', () => {
      class TargetComponent extends Composite { @property text; }
      const target = new TargetComponent({id: 'textInput1'});
      expect(() => widget.append(target)).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
        + 'Right hand property "text" requires an explicit type check.'
      );
    });

    it('warns in non-strict mode if binding to unknown type (emitDecoratorMetadata: true)', () => {
      injector.jsxProcessor.unsafeBindings = 'warn';
      class TargetComponent extends Composite { @property text; }
      spy(console, 'warn');
      const target = new TargetComponent({id: 'textInput1'});

      widget.append(target);

      expect(console.warn).to.have.been.calledOnce;
      expect(console.warn).to.have.been.calledWithMatch(
        'Unsafe two-way binding "myText" <-> "#textInput1.text": '
       + 'Right hand property "text" has no type check.'
      );
    });

    it('warns in non-strict mode if binding to to unknown (emitDecoratorMetadata: false)', () => {
      injector.jsxProcessor.unsafeBindings = 'warn';
      class TargetComponent extends Composite {}
      property(TargetComponent.prototype, 'text');
      spy(console, 'warn');

      const target = new TargetComponent({id: 'textInput1'});

      widget.append(target);

      expect(console.warn).to.have.been.calledOnce;
      expect(console.warn).to.have.been.calledWithMatch(
        'Unsafe two-way binding "myText" <-> "#textInput1.text": '
        + 'Right hand property "text" has no type check.'
      );
    });

    it('allows binding to advanced type with type guard', () => {
      class TargetComponent extends Composite {
        /** @type {string | number} */
        @property(v => typeof v === 'string' || typeof v === 'number')
        text;
      }
      const target = new TargetComponent({id: 'textInput1'});

      widget.append(target);
      widget.myText = 'foo';

      expect(target.text).to.equal('foo');
    });

    it('throws if binding finds multiple targets', () => {
      expect(() => widget.append(new TextInput({id: 'textInput1'}), new TextInput({id: 'textInput1'}))).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
        + 'Multiple widgets matching "#textInput1" were appended.'
      );
    });

    it('applies initial value to target', () => {
      const foo = new TextInput({id: 'foo'});
      foo.text = 'bar';

      const component2 = new ComponentWithInitialValue();
      component2.append(foo);

      expect(foo.text).to.equal('foo');
    });

    it('applies component changes to target', () => {
      widget.append(textInput1);

      widget.myText = 'bar';

      expect(textInput1.text).to.equal('bar');
    });

    it('uses initial target value as fallback when undefined is initial base value', () => {
      widget.myText = undefined;

      widget.append(textInput1);

      expect(textInput1.text).to.equal('foo');
      expect(widget.myText).to.equal('foo');
    });

    it('uses initial target value as fallback when undefined is set', () => {
      widget.append(textInput1);

      widget.myText = 'bar';
      widget.myText = undefined;

      expect(textInput1.text).to.equal('foo');
      expect(widget.myText).to.equal('foo');
    });

    it('applies null', () => {
      widget.append(textInput1);

      widget.myText = null;

      expect(textInput1.text).to.equal('');
      expect(widget.myText).to.equal(null);
    });

    it('fires change event when target changes', () => {
      widget.append(textInput1);
      const listener = stub();
      widget.on('myTextChanged', listener);

      textInput1.text = 'foobar';

      expect(listener).to.have.been.calledWithMatch({
        target: widget, value: 'foobar', type: 'myTextChanged'
      });
    });

    it('fires change event when component changes', () => {
      widget.append(textInput1);
      const listener = stub();
      widget.on('myTextChanged', listener);

      widget.myText = 'foobar';

      expect(listener).to.have.been.calledWithMatch({
        target: widget, value: 'foobar', type: 'myTextChanged'
      });
    });

    it('throws if target value changes to wrong type', () => {
      @component class CustomChild extends Composite {
        /** @type {string | number} */
        @property(v => true) text;
      }
      const child = new CustomChild({id: 'textInput1'});
      child.text = 'foo';
      widget.append(child);

      expect(() => child.text = 23).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to update left hand property: '
        + 'Failed to set property "myText": '
        + 'Expected value "23" to be of type string, but found number.'
      );
    });

    it('fires change event when binding is initialized', () => {
      textInput1.text = 'foo';
      const listener = stub();
      widget.on('myTextChanged', listener);

      widget.append(textInput1);

      expect(listener).to.have.been.calledWithMatch({
        target: widget, value: 'foo', type: 'myTextChanged'
      });
    });

  });

  describe('@bind(\'path\')', () => {

    /** @type {TextInput} */
    let textInput;

    beforeEach(() => {
      textInput = new TextInput({id: 'textInput1', text: 'foo'});
    });

    it('throws in strict mode (emitDecoratorMetadata: true)', () => {
      @component class FailedComponent extends Composite {
        @bind('#textInput1.text') myText;
      }

      expect(() => new FailedComponent().append(textInput)).to.throw();
    });

    it('throws in strict mode (emitDecoratorMetadata: false)', () => {
      @component class FailedComponent extends Composite { myText; }
      bind('#textInput1.text')(FailedComponent.prototype, 'myText');

      expect(() => new FailedComponent().append(textInput)).to.throw();
    });

    it('warns in non-strict mode (emitDecoratorMetadata: true)', () => {
      @component class FailedComponent extends Composite {
        @bind('#textInput1.text') myText;
      }
      injector.jsxProcessor.unsafeBindings = 'warn';
      const widget = new FailedComponent();
      spy(console, 'warn');

      widget.append(textInput);

      expect(console.warn).to.have.been.calledWith(
        'Unsafe two-way binding "myText" <-> "#textInput1.text": Left hand property "myText" has no type check.'
      );
      expect(widget.myText).to.equal('foo');
    });

    it('warns in non-strict mode (emitDecoratorMetadata: false)', () => {
      @component class FailedComponent extends Composite { myText; }
      bind('#textInput1.text')(FailedComponent.prototype, 'myText');
      injector.jsxProcessor.unsafeBindings = 'warn';
      const widget = new FailedComponent();
      spy(console, 'warn');

      widget.append(textInput);

      expect(console.warn).to.have.been.calledWith(
        'Unsafe two-way binding "myText" <-> "#textInput1.text": Left hand property "myText" has no type check.'
      );
      expect(widget.myText).to.equal('foo');
    });

  });

  describe('@bind({path, typeGuard})', () => {

    it('throws if target value changes to value rejected by type guard', () => {
      /** @type {number} */
      let value;
      class CustomChild extends Composite {
        /** @type {number} */
        @property({type: Number}) bar;
      }
      const guarded = new ComponentWithTypeGuard();
      const child = new CustomChild({id: 'foo'});
      guarded.append(child);

      expect(() => child.bar = 12).to.throw(
        'Binding "value" <-> "#foo.bar" failed to update left hand property: Failed to set '
        + 'property "value": Type guard check failed'
      );
    });

    it('throws if initial target value is rejected by type guard', () => {
      /** @type {number} */
      let value;
      class CustomChild extends Composite {
        /** @type {number} */
        @property(() => true) bar;
      }
      const guarded = new ComponentWithTypeGuard();
      const child = new CustomChild({id: 'foo'});

      child.bar = 12;

      expect(() => guarded.append(child)).to.throw(
        'Binding "value" <-> "#foo.bar" failed to initialize: Binding "value" <-> "#foo.bar" '
        + 'failed to sync back value of right hand property: Failed to set property "value": '
        + 'Type guard check failed'
      );
    });

    it('throws if own value is rejected by type guard', () => {
      expect(() => (new ComponentWithTypeGuard()).value = 12).to.throw(
        'Failed to set property "value": Type guard check failed'
      );
    });

    it('throws if "all" key is also present"', () => {
      expect(() => {
        @component
        class WrongComponent extends Composite {
          @bind({path: '#foo.bar', all: {foo: '#bar.baz'}})
          /** @type {MyItem} */
          @property myItem;
        }
      }).to.throw(Error, '@bind can not have "path" and "all" option simultaneously');
    });

  });

});
