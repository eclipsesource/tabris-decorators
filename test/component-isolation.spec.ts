import 'mocha';
import 'sinon';
import { Button, Composite, Properties, Widget } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox } from './test';
import { component, getById } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */

@component
class CustomComponent extends Composite {

  @getById
  public readonly foo3: Widget;

  constructor(properties: Properties<Composite>, containSelf: boolean) {
    super(properties);
    this.append(
      new Composite({class: 'foo', id: 'foo1'}),
      new Composite({class: 'foo', id: 'foo2'}),
      new Composite({class: 'foo', id: 'foo3'}),
      new Button({class: 'bar', id: 'foo4'}),
      (containSelf ? new CustomComponent({id: 'foo5'}, false) : new Composite())
    );
  }

  public protectedFind() {
    return this._find();
  }

  public protectedChildren() {
    return this._children();
  }

  public protectedApply(map: any) {
    return this._apply(map);
  }

}

describe('component', () => {

  let widget: CustomComponent;
  let parent: Composite;

  beforeEach(() => {
    parent = new Composite();
    widget = new CustomComponent({}, true);
    parent.append(widget);
  });

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  it('does not interfere with getById', () => {
    expect(widget.foo3.id).to.equal('foo3');
  });

  it('prevents child selection', () => {
    expect(widget.children().length).to.equal(0);
    expect(widget.find().length).to.equal(0);
    expect(parent.find().length).to.equal(1);
    expect(parent.find()[0]).to.equal(widget);
  });

  it('prevents child selection when applied to super class', () => {
    class CustomComponent2 extends CustomComponent {}
    parent = new Composite();
    widget = new CustomComponent2({}, true);
    parent.append(widget);

    expect(widget.children().length).to.equal(0);
    expect(widget.find().length).to.equal(0);
    expect(parent.find().length).to.equal(1);
    expect(parent.find()[0]).to.equal(widget);
  });

  it('prevents child selection when applied to super class and self', () => {
    @component class CustomComponent2 extends CustomComponent {}
    parent = new Composite();
    widget = new CustomComponent2({}, true);
    parent.append(widget);

    expect(widget.children().length).to.equal(0);
    expect(widget.find().length).to.equal(0);
    expect(parent.find().length).to.equal(1);
    expect(parent.find()[0]).to.equal(widget);
  });

  it('is aliased by @component', () => {
    @component
    class MyComponent extends Composite {
      constructor() {
        super();
        this.append(new Composite());
      }
    }
    let myWidget = new MyComponent();
    expect(myWidget.children().length).to.equal(0);
  });

  it('prevents direct apply call to work', () => {
    widget.apply({'*': {enabled: false}});
    expect(widget.foo3.enabled).to.be.true;
  });

  it('limits apply on parent to widget itself', () => {
    parent.apply({'*': {enabled: false}});
    expect(widget.enabled).to.be.false;
    expect(widget.foo3.enabled).to.be.true;
  });

  it('allows child selection via _children', () => {
    expect(widget.protectedChildren().length).to.equal(5);
    expect(widget.protectedFind().length).to.equal(5);
  });

  it('allows _apply call to work', () => {
    widget.protectedApply({'*': {enabled: false}});
    expect(widget.foo3.enabled).to.be.false;
  });

  it('limits _apply on parent to widget itself', () => {
    (parent as any)._apply({'*': {enabled: false}});
    expect(widget.enabled).to.be.false;
    expect(widget.foo3.enabled).to.be.true;
  });

  it('limits _find on parent to widget itself', () => {
    expect((parent as any).find().length).to.equal(1);
    expect((parent as any).find()[0]).to.equal(widget);
  });

});
