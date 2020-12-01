import 'mocha';
import 'sinon';
import {useFakeTimers} from 'sinon';
import {Color, ColorValue, Composite, tabris, TextInput} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy, stub} from './test';
import {bind, component, property} from '../src';

describe('component', () => {

  beforeEach(() => {
    tabris._init(new ClientMock());
  });

  afterEach(() => {
    restoreSandbox();
  });

  @component class CustomComponent extends Composite {

    @bind('#textInput1.text')
    myText: string;

    @bind({
      path: '#textInput1.layoutData',
      typeGuard: value => (value as any).width !== 23
    })
    myObject: object;

  }

  @component class ComponentWithInitialValue extends Composite {
    @bind('#foo.text') foo: string = 'foo';
  }

  let widget: CustomComponent;
  let textInput1: TextInput;

  beforeEach(() => {
    widget = new CustomComponent();
    textInput1 = new TextInput({id: 'textInput1', text: 'foo'});
  });

  describe('@bind(path)', () => {

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
          @bind('#textInput1.text') myText: string;
        }
        clock.tick(now + 100);
        expect(console.error).to.have.been.calledWith(
          'Binding "myText" <-> "#textInput1.text" failed to initialize: FailedComponent is not a @component'
        );
      });

    });

    it('fails to decorate with invalid binding path', () => {
      const badPaths: {[path: string]: string} = {
        '<foo.bar': 'Invalid path prefix.',
        '< foo.bar': 'Invalid path prefix.',
        '<>foo.bar': 'Invalid path prefix.',
        '<> foo.bar': 'Invalid path prefix.',
        'foo.bar': 'Binding path must start with direction or selector.',
        '#foo.bar.baz': 'Binding path has too many segments.',
        '#foo': 'Binding path needs at least two segments.',
        '#fo o.bar': 'Binding path contains invalid characters.',
        '#foo.bar[]': 'Binding path contains invalid characters.',
        '#foo.bar<>': 'Binding path contains invalid characters.'
      };
      for (const path in badPaths) {
        expect(() => {
          @component class FailedComponent extends Composite {
            @bind(path) readonly value: string;
          }
        }).to.throw(Error, 'Could not apply decorator "bind" to "value": ' + badPaths[path]);
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
        'Binding "myText" <-> "#textInput1.text" failed to initialize: No widget matching "#textInput1" was appended.'
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
        set: () => {},
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

    it('throws if binding to advanced type without type guard', () => {
      class TargetComponent extends Composite {
        @property text: string | number;
      }
      const target = new TargetComponent({id: 'textInput1'});
      expect(() => widget.append(target)).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
        + 'Right hand property "text" requires an explicit type check.'
      );
    });

    it('allows binding to advanced type with type guard', () => {
      class TargetComponent extends Composite {
        @property(v => typeof v === 'string' || typeof v === 'number')
        text: string | number;
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

      expect(widget.myText).to.equal('bar');
      expect(textInput1.text).to.equal('bar');
    });

    it('applies target changes to component', () => {
      widget.append(textInput1);

      textInput1.text = 'foobar';

      expect(widget.myText).to.equal('foobar');
      expect(textInput1.text).to.equal('foobar');
    });

    describe('with "<<" prefix', () => {

      @component class ToLeft extends Composite {
        // space after direction is tolerated
        @bind('<< #textInput1.text') myText: string;
        myObject: object;
      }

      beforeEach(() => {
        widget = new ToLeft();
      });

      it('applies initial target value to component', () => {
        textInput1.text = 'foobar';

        widget.append(textInput1);

        expect(textInput1.text).to.equal('foobar');
        expect(widget.myText).to.equal('foobar');
      });

      it('applies target changes to component', () => {
        widget.append(textInput1);

        textInput1.text = 'foobar';

        expect(widget.myText).to.equal('foobar');
      });

      it('does not apply initial component value to target', () => {
        widget.myText = 'foobar';
        textInput1.text = 'baz';

        widget.append(textInput1);

        expect(textInput1.text).to.equal('baz');
      });

      it('does not apply component property changes to target', () => {
        widget.append(textInput1);
        textInput1.text = 'baz';

        widget.myText = 'bar';

        expect(widget.myText).to.equal('bar');
        expect(textInput1.text).to.equal('baz');
      });

      it('allows binding to advanced type without type guard', () => {
        class TargetComponent extends Composite {
          @property text: string | number;
        }
        const target = new TargetComponent({id: 'textInput1'});
        expect(() => widget.append(target)).not.to.throw(Error);
      });

    });

    describe('with ">>" prefix', () => {

      @component class ToRight extends Composite {
        // space after direction is not required
        @bind('>>#textInput1.text') myText: string;
        myObject: object;
      }

      beforeEach(() => {
        widget = new ToRight();
      });

      it('applies initial component value to target', () => {
        widget.myText = 'foobar';

        widget.append(textInput1);

        expect(textInput1.text).to.equal('foobar');
        expect(widget.myText).to.equal('foobar');
      });

      it('applies component changes to target', () => {
        widget.append(textInput1);

        widget.myText = 'foobar';

        expect(textInput1.text).to.equal('foobar');
      });

      it('does not apply initial target value to component', () => {
        widget.myText = 'foobar';
        textInput1.text = 'baz';

        widget.append(textInput1);

        expect(widget.myText).to.equal('foobar');
      });

      it('does not apply target property changes to component', () => {
        widget.append(textInput1);
        widget.myText = 'bar';

        textInput1.text = 'baz';

        expect(widget.myText).to.equal('bar');
        expect(textInput1.text).to.equal('baz');
      });

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

      expect(listener).to.have.been.calledOnce;
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
        @property(v => true) text: string | number;
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

  describe('@bind({path, ...)', () => {

    @component class BindWithOptions extends Composite {

      @bind({
        path: '#foo.bar',
        typeGuard: v => (typeof v === 'string') || v === undefined
      })
      value: string | number;

      @bind({
        type: Color,
        path: '#foo.background',
        equals: 'auto',
        convert: 'auto',
        nullable: false,
        default: Color.white
      })
      color: ColorValue;

    }

    it('throws if target value changes to value rejected by type guard', () => {
      let value: number;
      class CustomChild extends Composite {
        @property bar: number;
      }
      const guarded = new BindWithOptions();
      const child = new CustomChild({id: 'foo'});
      guarded.append(child);

      expect(() => child.bar = 12).to.throw(
        'Binding "value" <-> "#foo.bar" failed to update left hand property: '
        + 'Failed to set property "value": Type guard check failed'
      );
    });

    it('throws if initial target value is rejected by type guard', () => {
      let value: number;
      class CustomChild extends Composite {
        @property bar: number;
      }
      const guarded = new BindWithOptions();
      const child = new CustomChild({id: 'foo'});

      child.bar = 12;

      expect(() => guarded.append(child)).to.throw(
        'Binding "value" <-> "#foo.bar" failed to initialize: Binding "value" <-> "#foo.bar" '
        + 'failed to sync back value of right hand property: Failed to set property "value": '
        + 'Type guard check failed'
      );
    });

    it('throws if own value is rejected by type guard', () => {
      expect(() => (new BindWithOptions()).value = 12).to.throw(
        'Failed to set property "value": Type guard check failed'
      );
    });

    it('throws if "all" key is also present"', () => {
      class MyItem { @property foo: string; }
      expect(() => {
        @component
        class WrongComponent extends Composite {
          @bind({path: '#foo.bar', all: {foo: '#bar.baz'}} as any)
          @property myItem: MyItem;
        }
      }).to.throw(Error, '@bind can not have "path" and "all" option simultaneously');
    });

    it('supports options nullable and default', () => {
      const notNullable = new BindWithOptions();
      notNullable.color = 'red';

      notNullable.color = null;

      expect(Color.from(notNullable.color).equals(Color.white)).to.be.true;
    });

    it('supports options type, convert and equals', () => {
      const withConverter = new BindWithOptions();
      withConverter.color = '#001122';
      const converted = withConverter.color;

      withConverter.color = '#001122';

      expect(converted).to.be.instanceOf(Color);
      expect(withConverter.color).to.equal(converted);
    });

  });

});
