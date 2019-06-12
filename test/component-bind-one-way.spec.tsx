import 'mocha';
import 'sinon';
import { Composite, CompositeProperties, TextInput, TextView } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox, stub } from './test';
import { component, property, to } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('component', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  interface Item {
    text: string;
    int: number;
  }

  @component
  class CustomComponent extends Composite {
    @property public myText: string = 'foo';
    @property public myNumber: number = 0;
    @property public myItem: Item = null;
    private readonly jsxProperties: CompositeProperties;
  }

  @component
  class CustomComponent2 extends Composite {
    @property public someProperty: string | boolean;
    @property(v => (typeof v === 'string' && v !== 'rejectMe') || typeof v === 'boolean' || v === undefined)
    public checkedSomeProperty: string | boolean;
    public someField: string;
    @property public numberProperty: number;
    private readonly jsxProperties: CompositeProperties;
  }

  let widget: CustomComponent;
  let widget2: CustomComponent2;
  let textInput: TextInput;
  let textView: TextView;

  beforeEach(() => {
    widget = new CustomComponent();
  });

  afterEach(() => {
    widget.dispose();
    if (textInput) { textInput.dispose(); }
    if (textView) { textView.dispose(); }
    if (widget2) { widget2.dispose(); }
  });

  describe('bind-<property>', () => {

    it('applies the current source property value to property of unknown type', () => {
      widget.append(textInput = <textInput bind-text='myText'/>);

      expect(textInput.text).to.equal('foo');
    });

    it('applies changes of source property value', () => {
      widget.append(textInput = <textInput bind-text='myText'/>);

      widget.myText = 'bar';

      expect(textInput.text).to.equal('bar');
    });

    it('uses initial target value as fallback when undefined is set', () => {
      widget.append(textInput = <textInput bind-text='myText' text='foo'/>);

      widget.myText = 'bar';
      widget.myText = undefined;

      expect(textInput.text).to.equal('foo');
    });

    it('applies null', () => {
      widget.append(textInput = <textInput bind-text='myText' text='foo'/>);

      widget.myText = 'bar';
      widget.myText = null;

      expect(textInput.text).to.equal('');
    });

    it('works with <widgetCollection>', () => {
      widget.append(<widgetCollection><textInput bind-text='myText'/></widgetCollection>);
      widget.myText = 'bar';

      expect((widget as any)._find().first(TextInput).text).to.equal('bar');
    });

    it('ignores detaching the source', () => {
      widget.append(textInput = <textInput bind-text='myText'/>);

      textInput.detach();
      widget.myText = 'bar';

      expect(textInput.text).to.equal('bar');
    });

    it('fails to bind non-existing property', () => {
      expect(() => {
        widget.append(<CustomComponent bind-someField='myText' />);
      }).to.throw(
          'Binding "someField" -> "myText" failed: '
        + 'Target does not have a property "someField"'
      );
    });

    it('fails to bind to non-existing base property', () => {
      expect(() => {
        widget.append(textInput = <textInput bind-text='doesNotExist'/>);
      }).to.throw(
        'Binding "text" -> "doesNotExist" failed: CustomComponent does not have a property "doesNotExist"'
      );
    });

    it('fails to bind to unserializable child property type without type guard', () => {
      expect(() => {
        widget.append(<CustomComponent2 bind-someProperty='myText' />);
      }).to.throw(
          'Binding "someProperty" -> "myText" failed: '
        + 'Can not bind to property "someProperty" without type guard.'
      );
    });

    it('allows to bind to unserializable child property type with type guard', () => {
      let target: CustomComponent2 = <CustomComponent2 bind-checkedSomeProperty='myText' />;
      widget.append(target);
      widget.myText = 'foo';

      expect(target.checkedSomeProperty).to.equal('foo');
    });

    it('fails if child type guard rejects', () => {
      let target: CustomComponent2 = <CustomComponent2 bind-checkedSomeProperty='myText' />;
      widget.append(target);
      widget.myText = 'foo';

      expect(() => {
        widget.myText = 'rejectMe';
      }).to.throw(
          'Binding "checkedSomeProperty" -> "myText" failed: Failed to set property "checkedSomeProperty": '
        + 'Type guard check failed'
      );
    });

    it('fails to bind with incompatible property type', () => {
      expect(() => {
        widget.append(<CustomComponent2 bind-numberProperty='myText' />);
      }).to.throw(
          'Binding "numberProperty" -> "myText" failed: Failed to set property "numberProperty": '
        + 'Expected value "foo" to be of type number, but found string.'
      );
    });

    it('fails to bind when changing to incompatible property type', () => {
      widget2 = new CustomComponent2();
      widget2.append(<CustomComponent bind-myText='someProperty' />);
      expect(() => {
        widget2.someProperty = false;
      }).to.throw(
        'Binding "myText" -> "someProperty" failed: Failed to set property "myText": '
      + 'Expected value "false" to be of type string, but found boolean.'
      );
    });

    it('fails to decorate with invalid binding path', () => {
      const badPaths: {[path: string]: string} = {
        'foo.bar': 'CustomComponent does not have a property "foo".',
        '#foo': 'JSX binding path can currently not contain a selector.',
        '.foo': 'JSX binding path can currently not contain a selector.'
      };
      for (let path in badPaths) {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={path} />);
        }).to.throw(`Binding "numberProperty" -> "${path}" failed: ${badPaths[path]}`);
      }
    });

    it('throws on appear when applied to an non-@component', () => {
      class NotAComponent extends Composite {
        @property public myText: string = 'foo';
      }
      let widget3 = new NotAComponent();
      let widget4 = <textView id='foo' bind-text='myText' /> as TextView;
      widget3.append(widget4);
      expect(() => {
        widget4.trigger('resize', {target: widget4});
      }).to.throw(
          'Could not resolve one-way binding: Not appended to a @component\n'
        + `NotAComponent[cid="${widget3.cid}"] > TextView[cid="${widget4.cid}"]#foo`
      );
    });

    it('does not throw on appear when applied to a @component', () => {
      let widget4 = <textView bind-text='myText' /> as TextView;
      widget.append(widget4);
      expect(() => {
        widget4.trigger('resize', {target: widget4});
      }).not.to.throw;
    });

    it('can bind to object property', () => {
      widget.append(textInput = <textInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};

      expect(textInput.text).to.equal('bar');
    });

    it('ignores changes on bound object', () => {
      widget.append(textInput = <textInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};
      widget.myItem.text = 'baz';

      expect(textInput.text).to.equal('bar');
    });

    it('updates on object replacement', () => {
      widget.append(textInput = <textInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'bar', int: 23};
      widget.myItem = {text: 'baz', int: 23};

      expect(textInput.text).to.equal('baz');
    });

    it('falls back to initial value on null', () => {
      widget.append(textInput = <textInput bind-text='myItem.text' text='foo'/>);

      widget.myItem = {text: 'foo', int: 23};
      widget.myItem = null;

      expect(textInput.text).to.equal('foo');
    });

    it('falls back to initial value on initial value undefined', () => {
      widget.append(textInput = <textInput bind-text='myItem.text' text='foo'/>);

      expect(textInput.text).to.equal('foo');
    });

    describe('to', () => {

      it('applies changes of source property value', () => {
        widget.append(textInput = <textInput bind-text={to('myText', v => v)} />);

        widget.myText = 'bar';

        expect(textInput.text).to.equal('bar');
      });

      it('calls converter with initial value', () => {
        const converter = stub().returns('foo');
        widget.myText = 'bar';

        widget.append(textInput = <textInput bind-text={to('myText', converter)} />);

        expect(converter).to.have.been.calledOnce;
        expect(converter).to.have.been.calledWith('bar');
        expect(textInput.text).to.equal('foo');
      });

      it('fails to bind with converter returning incompatible type', () => {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={to('myText', v => !!v)} />);
        }).to.throw(
            'Binding "numberProperty" -> "myText" failed: Failed to set property "numberProperty": '
          + 'Expected value "true" to be of type number, but found boolean.'
        );
      });

      it('fails to bind with converter throwing', () => {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={to('myText', v => { throw new Error('fooerror'); })} />);
        }).to.throw(
            'Binding "numberProperty" -> "myText" failed: Converter exception: fooerror'
        );
      });

    });

  });

  describe('template-<property>', () => {

    it('throws for incorrect syntax', () => {
      const badPaths: {[path: string]: string} = {
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
      for (let path in badPaths) {
        expect(() => {
          widget.dispose();
          widget = new CustomComponent();
          widget.append(<textView template-text={path} />);
        }).to.throw(`Template binding "text" -> "${path}" failed: ${badPaths[path]}`);
      }
    });

    it('applies changes of source property value with template', () => {
      widget.append(textInput = <textInput template-text='Hello ${myText}!'/>);

      widget.myText = 'bar';

      expect(textInput.text).to.equal('Hello bar!');
    });

    it('converts non-strings', () => {
      widget.append(textInput = <textInput template-text='Hello ${myNumber}!'/>);

      widget.myNumber = 23;

      expect(textInput.text).to.equal('Hello 23!');
    });

    it('fallback value not inserted in template', () => {
      widget.append(textInput = <textInput template-text='Hello ${myNumber}!' text='no one here'/>);

      widget.myNumber = undefined;

      expect(textInput.text).to.equal('no one here');
    });

  });

});
