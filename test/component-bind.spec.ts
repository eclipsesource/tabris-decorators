import 'mocha';
import 'sinon';
import { useFakeTimers } from 'sinon';
import { Composite, TextInput } from 'tabris';
import { ImageView } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox, spy, stub } from './test';
import { bind, component, Image, property } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('bind', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  @component class CustomComponent extends Composite {

    @bind('#textInput1.text')
    public myText: string;

  }

  @component class ComponentWithInitialValue extends Composite {
    @bind('#foo.text') public foo: string = 'foo';
  }

  @component class ComponentWithImage extends Composite {

    @bind('#imageView1.image')
    public myImage: Image;

  }

  let widget: CustomComponent;
  let textInput1: TextInput;

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

  it('value still linked after disposing the target', () => {
    widget.append(textInput1);

    textInput1.dispose();

    expect(widget.myText).to.be.undefined;
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
        @bind('#textInput1.text') public myText: string;
      }
      clock.tick(now + 100);
      expect(console.error).to.have.been.calledWith(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: FailedComponent is not a @component'
      );
    });

    it('throws on access', () => {
      class FailedComponent extends Composite {

        @bind('#textInput1.text')
        public myText: string;

        constructor() {
          super({});
          this.append(new TextInput({id: 'textInput1'}));
        }

      }
      expect(() => new FailedComponent().myText).to.throw(
          'Binding "myText" <-> "#textInput1.text" failed to provide FailedComponent property "myText": '
        + 'FailedComponent is not a @component'
      );
    });

  });

  it('fails to decorate unknown type', () => {
    expect(() => {
      @component class FailedComponent extends Composite {
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
        @component class FailedComponent extends Composite {
          @bind(path) public readonly value: string;
        }
      }).to.throw('Could not apply decorator "bind" to "value": ' + badPaths[path]);
    }
  });

  it('allows to initialize base property on declaration', () => {
    let component2 = new ComponentWithInitialValue();

    expect(component2.foo).to.equal('foo');
  });

  it('allows to change base property before first append', () => {
    let component2 = new ComponentWithInitialValue();
    let listener = stub();
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
    let target = new Composite({id: 'textInput1'});
    (target as any).text = 23;
    expect(() => widget.append(target)).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('throws if binding to advanced type without type guard', () => {
    class TargetComponent extends Composite {
      @property public text: string | number;
    }
    let target = new TargetComponent({id: 'textInput1'});
    expect(() => widget.append(target)).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to initialize: '
      + 'Can not bind to advanced type without type guard.'
    );
  });

  it('allows binding to advanced type with type guard', () => {
    class TargetComponent extends Composite {
      @property(v => typeof v === 'string' || typeof v === 'number')
      public text: string | number;
    }
    let target = new TargetComponent({id: 'textInput1'});

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
    let foo = new TextInput({id: 'foo'});
    foo.text = 'bar';

    let component2 = new ComponentWithInitialValue();
    component2.append(foo);

    expect(foo.text).to.equal('foo');
  });

  it('applies changes to target', () => {
    widget.append(textInput1);

    widget.myText = 'bar';

    expect(textInput1.text).to.equal('bar');
  });

  it('fires change event when target changes', () => {
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
    @component class CustomChild extends Composite {
      @property(v => true) public text: string | number;
    }
    let child = new CustomChild({id: 'textInput1'});
    child.text = 'foo';
    widget.append(child);

    expect(() => child.text = 23).to.throw(
        'Binding "myText" <-> "#textInput1.text" failed to update CustomChild property "text": '
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
        'Binding "myText" <-> "#textInput1.text" failed to provide CustomComponent property "myText": '
      + 'Expected value to be of type "string", but found "number".'
    );
  });

  it('throws own value changes to wrong type', () => {
    widget.append(textInput1);

    expect(() => (widget as any).myText = 23).to.throw(
       'Binding "myText" <-> "#textInput1.text" failed to update target value: '
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

    let widget2: ComponentWithImage;
    let imageView: ImageView;

    beforeEach(() => {
      widget2 = new ComponentWithImage();
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
