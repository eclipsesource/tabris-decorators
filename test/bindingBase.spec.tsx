import 'mocha';
import 'sinon';
import { Composite, TextInput, TextView } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox } from './test';
import { bindingBase, property } from '../src';
import { component } from '../src/component';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */

describe('bindingBase', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  @bindingBase
  class CustomComponent extends Composite {
    @property public myText: string = 'foo';
  }

  @bindingBase
  class CustomComponent2 extends Composite {
    @property public someProperty: string | boolean;
    public someField: string;
    @property public numberProperty: number;
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

    it('also enabled by @component', () => {
      @component
      class MyComponent extends Composite {
        @property public myText: string = 'foo';
      }
      widget = new MyComponent();
      widget.append(textInput = <textInput bind-text='myText'/>);
      widget.myText = 'bar';

      expect(textInput.text).to.equal('bar');
    });

    it('works with <widgetCollection>', () => {
      widget.append(<widgetCollection><textInput bind-text='myText'/></widgetCollection>);
      widget.myText = 'bar';

      expect(widget.find().first(TextInput).text).to.equal('bar');
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
          'Could not bind property "someField" to "myText": '
        + 'Target does not have a property "someField"'
      );
    });

    it('fails to bind to non-existing base property', () => {
      expect(() => {
        widget.append(textInput = <textInput bind-text='doesNotExist'/>);
      }).to.throw(
          'Could not bind property "text" to "doesNotExist": '
        + 'Base does not have a property "doesNotExist"'
      );
    });

    it('fails to bind with unserializable property type', () => {
      expect(() => {
        widget.append(<CustomComponent2 bind-someProperty='myText' />);
      }).to.throw(
          'Could not bind property "someProperty" to "myText": '
        + 'Type of "someProperty" could not be inferred. Only classes and primitive types are supported.'
      );
    });

    it('fails to bind with incompatible property type', () => {
      expect(() => {
        widget.append(<CustomComponent2 bind-numberProperty='myText' />);
      }).to.throw(
          'Could not bind property "numberProperty" to "myText": '
        + 'Expected value to be of type "number", but found "string".'
      );
    });

    it('fails to bind when changing to incompatible property type', () => {
      widget2 = new CustomComponent2();
      widget2.append(<CustomComponent bind-myText='someProperty' />);
      expect(() => {
        widget2.someProperty = false;
      }).to.throw(
          'Binding "someProperty" failed: '
        + 'Expected value to be of type "string", but found "boolean".'
      );
    });

    it('fails to decorate with invalid binding path', () => {
      const badPaths: {[path: string]: string} = {
        'foo.bar': 'JSX binding path can currently only have one segment.',
        '#foo': 'JSX binding path can currently not contain a selector.',
        '.foo': 'JSX binding path can currently not contain a selector.',
        'this': 'Binding path contains reserved word "this".'
      };
      for (let path in badPaths) {
        expect(() => {
          widget.append(<CustomComponent2 bind-numberProperty={path} />);
        }).to.throw(`Could not bind property "numberProperty" to "${path}": ${badPaths[path]}`);
      }
    });

  });

});
