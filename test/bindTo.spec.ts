/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */
import 'mocha';
import 'sinon';
import { Composite, TextInput, TextView } from 'tabris';
import { bindTo } from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect, stub} from './test';
import property from '../src/property';
import { ImageView } from 'tabris';

describe('bindTo', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  class CustomComponent extends Composite {

    @bindTo('#textInput1.text')
    public myText: string;

  }

  let widget: CustomComponent;
  let textInput1: TextInput;

  beforeEach(() => {
    widget = new CustomComponent();
    textInput1 = new TextInput({id: 'textInput1', text: 'foo'});
  });

  it('returns the source property value', () => {
    widget.append(textInput1);

    expect(widget.myText).to.equal('foo');
  });

  it('returns the changed source property value', () => {
    widget.append(textInput1);

    textInput1.text = 'bar';

    expect(widget.myText).to.equal('bar');
  });

  it('value still linked after disposing the source', () => {
    widget.append(textInput1);

    textInput1.dispose();

    expect(widget.myText).to.be.undefined;
  });

  it('fails to decorate unknown type', () => {
    expect(() => {
      class FailedComponent extends Composite {
        @bindTo('#foo.bar') public readonly value: string | boolean;
      }
    }).to.throw(
        'Could not apply decorator "bindTo" to "value": '
      + 'Property type could not be inferred. Only classes and primitive types are supported.'
    );
  });

  it('throws if property is accessed before first append', () => {
    expect(() => widget.myText).to.throw(
        'Can not access property "myText": '
      + 'Binding "#textInput1.text" is not ready because no widgets have been appended yet.'
    );
  });

  it('throws if a binding source can not be resolved after first append', () => {
    expect(() => widget.append(new TextInput({id: 'textInput2'}))).to.throw(
      'Could not bind property "myText" to "#textInput1.text": No widget with id "textInput1" appended.'
    );
  });

  it('throws if binding to misssing property', () => {
    expect(() => widget.append(new Composite({id: 'textInput1'}))).to.throw(
      'Could not bind property "myText" to "#textInput1.text": Source does not have a property "text".'
    );
  });

  it('throws if binding to wrong value type', () => {
    let source = new Composite({id: 'textInput1'});
    (source as any).text = 23;
    expect(() => widget.append(source)).to.throw(
        'Could not bind property "myText" to "#textInput1.text": '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('throws if binding finds multiple sources', () => {
    expect(() => widget.append(new TextInput({id: 'textInput1'}), new TextInput({id: 'textInput1'}))).to.throw(
      'Could not bind property "myText" to "#textInput1.text": Multiple widgets with id "textInput1" appended.'
    );
  });

  it('does not store changes to self', () => {
    widget.append(textInput1);

    widget.myText = 'bar';

    expect(widget.myText).to.equal('foo');
  });

  it('does not apply changes to source', () => {
    widget.append(textInput1);

    widget.myText = 'bar';

    expect(textInput1.text).to.equal('foo');
  });

  it('fires change event when source changes', () => {
    widget.append(textInput1);
    let listener = stub();
    widget.on('myTextChanged', listener);

    textInput1.text = 'foo';

    expect(listener).to.have.been.calledWithMatch({
      target: widget, value: 'foo', type: 'myTextChanged'
    });
  });

  it('fires no change event when attempting to set on self', () => {
    widget.append(textInput1);
    let listener = stub();
    widget.on('myTextChanged', listener);

    widget.myText = 'foo';

    expect(listener).not.to.have.been.called;
  });

});
