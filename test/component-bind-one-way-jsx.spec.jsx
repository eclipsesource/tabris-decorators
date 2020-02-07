import 'mocha';
import {Composite, tabris, TextInput, TextView, WidgetCollection} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, stub, spy} from './test';
import {component, event, injector, property, to} from '../src';

class ItemB {

  /** @type {tabris.ChangeListeners<ItemB, 'otherItem'>} */
  @event onOtherItemChanged;

  /** @type {string} */
  @property text;

  /** @type {number} */
  @property int;

  /** @type {Item} */
  otherItem;

}

class ItemA {

  /** @type {string} */
  @property text;

  /** @type {number} */
  @property int;

  /** @type {Item} */
  @property otherItem;

}

@component
class CustomComponent extends Composite {

  /** @type {string} */
  @property myText = 'foo';

  /** @type {number} */
  @property myNumber = 0;

  /** @type {Item} */
  @property myItem = null;
}

@component
class CustomComponent2 extends Composite {

  /** @type {string | boolean} */
  @property someProperty;

  /** @type {string | boolean} */
  @property(v => (typeof v === 'string' && v !== 'rejectMe') || typeof v === 'boolean' || v === undefined)
  checkedSomeProperty;

  /** @type {string} */
  someField;

  /** @type {number} */
  @property numberProperty;

}

/**
 * @typedef {import('./component-bind-one-way.spec').Item} Item
 */

describe('component', () => {

  beforeEach(() => {
    tabris._init(new ClientMock());
    injector.jsxProcessor.strictMode = false;
  });

  afterEach(() => {
    restoreSandbox();
  });

  /** @type {CustomComponent} */
  let widget;

  /** @type {TextInput} */
  let textInput;

  /** @type {TextView} */
  let textView;

  beforeEach(() => {
    JSX.install(injector.jsxProcessor);
    widget = new CustomComponent();
  });

  afterEach(() => {
    widget.dispose();
    if (textInput) { textInput.dispose(); }
    if (textView) { textView.dispose(); }
  });

  describe('bind-<property>', () => {

    it('applies the current source property value to property of unknown type', () => {
      widget.append(textInput = <TextInput bind-text='myText'/>);

      expect(textInput.text).to.equal('foo');
    });

    it('applies changes of source property value', () => {
      widget.append(textInput = <TextInput bind-text='myText'/>);

      widget.myText = 'bar';

      expect(textInput.text).to.equal('bar');
    });

    it('uses initial target value as fallback when undefined is set', () => {
      widget.append(textInput = <TextInput bind-text='myText' text='foo'/>);

      widget.myText = 'bar';
      widget.myText = undefined;

      expect(textInput.text).to.equal('foo');
    });

    it('applies null', () => {
      widget.append(textInput = <TextInput bind-text='myText' text='foo'/>);

      widget.myText = 'bar';
      widget.myText = null;

      expect(textInput.text).to.equal('');
    });

    it('works with <WidgetCollection>', () => {
      widget.append(<WidgetCollection><TextInput bind-text='myText'/></WidgetCollection>);
      widget.myText = 'bar';

      expect(widget._find().first(TextInput).text).to.equal('bar');
    });

    it('ignores detaching the source', () => {
      widget.append(textInput = <TextInput bind-text='myText'/>);

      textInput.detach();
      widget.myText = 'bar';

      expect(textInput.text).to.equal('bar');
    });

    it('fails to bind non-existing property', () => {
      expect(() => {
        widget.append(<CustomComponent bind-someField='myText'/>);
      }).to.throw(
        'Binding "someField" -> "myText" failed: '
        + 'Target does not have a property "someField"'
      );
    });

    it('fails to bind to non-existing base property', () => {
      expect(() => {
        widget.append(textInput = <TextInput bind-text='doesNotExist'/>);
      }).to.throw(
        'Binding "text" -> "doesNotExist" failed: CustomComponent does not have a property "doesNotExist"'
      );
    });

    it('warns when binding with potentially incompatible property type', () => {
      spy(console, 'warn');

      widget.append(<CustomComponent2 bind-numberProperty='myText'/>);

      expect(console.warn).to.have.been.calledWith(
        'Unsafe binding "numberProperty" -> "myText": Property "numberProperty" has no type guard.'
      );
    });

    it('does not warn when binding to child property with type guard', () => {
      const sp = spy(console, 'warn');
      /** @type {CustomComponent2} */
      const target = <CustomComponent2 bind-checkedSomeProperty='myText'/>;
      widget.append(target);
      widget.myText = 'foo';

      expect(console.warn).not.to.have.been.called;
      expect(target.checkedSomeProperty).to.equal('foo');
    });

    it('fails if child type guard rejects', () => {
      /** @type {CustomComponent2} */
      const target = <CustomComponent2 bind-checkedSomeProperty='myText'/>;
      widget.append(target);
      widget.myText = 'foo';

      expect(() => {
        widget.myText = 'rejectMe';
      }).to.throw(
        'Binding "checkedSomeProperty" -> "myText" failed: Failed to set property "checkedSomeProperty": '
        + 'Type guard check failed'
      );
    });

    it('fails to decorate with invalid binding path', () => {
      const badPaths = {
        'foo.bar': 'CustomComponent does not have a property "foo".',
        '#foo': 'JSX binding path can currently not contain a selector.',
        '.foo': 'JSX binding path can currently not contain a selector.'
      };
      for (const path in badPaths) {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={path}/>);
        }).to.throw(`Binding "numberProperty" -> "${path}" failed: ${badPaths[path]}`);
      }
    });

    it('throws on appear when applied to an non-@component', () => {
      class NotAComponent extends Composite {
        @property myText = 'foo';
      }
      const widget3 = new NotAComponent();
      /** @type {TextView} */
      const widget4 = <TextView bind-text='myText'/>;
      widget3.append(widget4);
      expect(() => {
        widget4.trigger('resize', {target: widget4});
      }).to.throw(
        'Could not resolve one-way binding on CustomComponent: Not appended to a @component'
      );
    });

    it('does not throw on appear when applied to a @component', () => {
      /** @type {TextView} */
      const widget4 = <TextView bind-text='myText'/>;
      widget.append(widget4);
      expect(() => {
        widget4.trigger('resize', {target: widget4});
      }).not.to.throw;
    });

    it('can bind to object property', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};

      expect(textInput.text).to.equal('bar');
    });

    it('ignores changes on bound object property', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};
      widget.myItem.text = 'baz';

      expect(textInput.text).to.equal('bar');
    });

    it('detect changes on bound object @property', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = Object.assign(new ItemA(), {text: 'bar', int: 23});
      widget.myItem.text = 'baz';

      expect(textInput.text).to.equal('baz');
    });

    it('detect changes on bound object property with change events', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = Object.assign(new ItemB(), {text: 'bar', int: 23});
      widget.myItem.text = 'baz';
      widget.myItem.onOtherItemChanged.trigger();

      expect(textInput.text).to.equal('baz');
    });

    it('detect changes on bound nested object @property', () => {
      widget.append(textInput = <TextInput bind-text='myItem.otherItem.text' text='foo'/>);

      widget.myItem = new ItemA();
      widget.myItem.otherItem = new ItemA();
      widget.myItem.otherItem.text = 'baz';

      expect(textInput.text).to.equal('baz');
    });

    it('updates on object replacement', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};
      widget.myItem = {text: 'baz', int: 23};

      expect(textInput.text).to.equal('baz');
    });

    it('falls back to initial value on null', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'foo', int: 23};
      widget.myItem = null;

      expect(textInput.text).to.equal('foo');
    });

    it('falls back to initial value on initial value undefined', () => {
      widget.append(textInput = <TextInput bind-text='myItem.text' text='foo'/>);

      expect(textInput.text).to.equal('foo');
    });

    it('ignores changes on bound nested object after component dispose', () => {
      widget.append(textInput = <TextInput bind-text='myItem.otherItem.text' text='foo'/>);
      const myItem = widget.myItem = new ItemA();
      widget.myItem.otherItem = new ItemA();
      widget.myItem.otherItem.text = 'baz';

      textInput.detach();
      widget.dispose();
      myItem.otherItem.text = 'foo';

      expect(textInput.text).to.equal('baz');
    });

    describe('to', () => {

      it('applies changes of source property value', () => {
        widget.append(textInput = <TextInput bind-text={to('myText', v => v)}/>);

        widget.myText = 'bar';

        expect(textInput.text).to.equal('bar');
      });

      it('calls converter with initial value', () => {
        const converter = stub().returns('foo');
        widget.myText = 'bar';

        widget.append(textInput = <TextInput bind-text={to('myText', converter)}/>);

        expect(converter).to.have.been.calledOnce;
        expect(converter).to.have.been.calledWith('bar');
        expect(textInput.text).to.equal('foo');
      });

      it('fails to bind with converter throwing', () => {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={to('myText', v => { throw new Error('foo'); })}/>);
        }).to.throw(
          'Binding "numberProperty" -> "myText" failed: Converter exception: foo'
        );
      });

    });

  });

  describe('template-<property>', () => {

    it('throws for incorrect syntax', () => {
      const badPaths = {
        'hello': 'Template "hello" does not contain a valid placeholder',
        'hello}': 'Template "hello}" does not contain a valid placeholder',
        '${hello': 'Template "${hello" does not contain a valid placeholder',
        '${he lo}': 'Binding path contains invalid characters.',
        '${hello}${hello}': 'Template "${hello}${hello}" contains too many placeholder',
        'hello ${foo} world': 'CustomComponent does not have a property "foo".',
        'hello ${foo.bar}': 'CustomComponent does not have a property "foo".',
        'hello ${#foo}': 'JSX binding path can currently not contain a selector.',
        'hello ${.foo}': 'JSX binding path can currently not contain a selector.'
      };
      for (const path in badPaths) {
        expect(() => {
          widget.dispose();
          widget = new CustomComponent();
          widget.append(<TextView template-text={path}/>);
        }).to.throw(`Template binding "text" -> "${path}" failed: ${badPaths[path]}`);
      }
    });

    it('applies changes of source property value with template', () => {
      widget.append(textInput = <TextInput template-text='Hello ${myText}!'/>);

      widget.myText = 'bar';

      expect(textInput.text).to.equal('Hello bar!');
    });

    it('converts non-strings', () => {
      widget.append(textInput = <TextInput template-text='Hello ${myNumber}!'/>);

      widget.myNumber = 23;

      expect(textInput.text).to.equal('Hello 23!');
    });

    it('fallback value not inserted in template', () => {
      widget.append(textInput = <TextInput template-text='Hello ${myNumber}!' text='no one here'/>);

      widget.myNumber = undefined;

      expect(textInput.text).to.equal('no one here');
    });

  });

});
