import 'mocha';
import 'sinon';
import { Composite, TextInput } from 'tabris';
import { ImageView } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox, stub } from './test';
import { bind, component, Image, property } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */

describe('bind', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  @component class CustomComponent extends Composite {

    @bind('#textInput1.text')
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

  it('ignores detaching the source', () => {
    widget.append(textInput1);

    textInput1.detach();
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
        @bind('#foo.bar') public readonly value: string | boolean;
      }
    }).to.throw(
        'Could not apply decorator "bind" to "value": '
      + 'Type of "value" could not be inferred. '
      + 'Only classes and primitive types are supported.'
    );
  });

  it('fails to decorate with invalid binding path', () => {
    const badPaths: {[path: string]: string} = {
      'foo.bar': 'Binding path needs to start with "#".',
      '#foo.bar.baz': 'Binding path has too many segments.',
      '#foo': 'Binding path needs at least two segments.',
      '#fo o.bar': 'Binding path contains invalid characters.',
      '#foo.bar[]': 'Binding path contains invalid characters.',
      '#foo.bar<>': 'Binding path contains invalid characters.',
      '#this.foo': 'Binding path contains reserved word "this".'
    };
    for (let path in badPaths) {
      expect(() => {
        class FailedComponent extends Composite {
          @bind(path) public readonly value: string;
        }
      }).to.throw('Could not apply decorator "bind" to "value": ' + badPaths[path]);
    }
  });

  it('throws if property is accessed before first append', () => {
    expect(() => widget.myText).to.throw(
        'Can not access property "myText": '
      + 'Binding "#textInput1.text" is not ready because no widgets have been appended yet.'
    );
  });

  it('throws if a binding source can not be resolved after first append', () => {
    expect(() => widget.append(new TextInput({id: 'textInput2'}))).to.throw(
      'Could not bind property "myText" to "#textInput1.text": No widget matching "#textInput1" was appended.'
    );
  });

  it('throws if binding to misssing property', () => {
    expect(() => widget.append(new Composite({id: 'textInput1'}))).to.throw(
      'Could not bind property "myText" to "#textInput1.text": Target does not have a property "text".'
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
      'Could not bind property "myText" to "#textInput1.text": Multiple widgets matching "#textInput1" were appended.'
    );
  });

  it('applies changes to source', () => {
    widget.append(textInput1);

    widget.myText = 'bar';

    expect(textInput1.text).to.equal('bar');
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

  it('fires change event when target changes', () => {
    widget.append(textInput1);
    let listener = stub();
    widget.on('myTextChanged', listener);

    widget.myText = 'foo';

    expect(listener).to.have.been.calledWithMatch({
      target: widget, value: 'foo', type: 'myTextChanged'
    });
  });

  it('throws if target value changes to wrong type', () => {
    class CustomChild extends Composite { @property public text: string | number; }
    let child = new CustomChild({id: 'textInput1'});
    child.text = 'foo';
    widget.append(child);

    expect(() => child.text = 23).to.throw(
        'Binding "#textInput1.text" failed: '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('throws if target value has changed to wrong type', () => {
    class CustomChild extends Composite { public text: string | number; }
    let child = new CustomChild({id: 'textInput1'});
    child.text = 'foo';
    widget.append(child);

    child.text = 23;

    expect(() => widget.myText).to.throw(
        'Binding "#textInput1.text" failed: '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('throws own value changes to wrong type', () => {
    widget.append(textInput1);

    expect(() => (widget as any).myText = 23).to.throw(
        'Binding "#textInput1.text" failed: '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('fires change event when binding is initialized', () => {
    textInput1.text = 'foo';
    let listener = stub();
    widget.on('myTextChanged', listener);

    widget.append(textInput1);

    expect(listener).to.have.been.calledWithMatch({
      target: widget, value: 'foo', type: 'myTextChanged'
    });
  });

  describe('with type Image', () => {

    class CustomComponent2 extends Composite {

      @bind('#imageView1.image')
      public myImage: Image;

    }

    let widget2: CustomComponent2;
    let imageView: ImageView;

    beforeEach(() => {
      widget2 = new CustomComponent2();
      imageView = new ImageView({id: 'imageView1'});
      widget2.append(imageView);
    });

    it('accepts strings', () => {
      widget2.myImage = '/foo.img';

      expect(imageView.image).to.deep.equal({src: '/foo.img'});
      expect(widget2.myImage).to.deep.equal({src: '/foo.img'});
    });

    it('accepts empty string', () => {
      widget2.myImage = '';

      expect(imageView.image).to.be.null;
      expect(widget2.myImage).to.be.null;
    });

    it('accepts object with src', () => {
      widget2.myImage = {src: '/foo.img'};

      expect(imageView.image).to.deep.equal({src: '/foo.img'});
      expect(widget2.myImage).to.deep.equal({src: '/foo.img'});
    });

    it('rejects empty objects at runtime', () => {
      expect(() => widget2.myImage = {}).to.throw;
    });

  });

});
