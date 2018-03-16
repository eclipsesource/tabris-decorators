/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */
import 'mocha';
import 'sinon';
import { Composite, Button, WidgetCollection, Widget } from 'tabris';
import { findFirst, findLast, findAll, getById, getByType, isolated, component } from '../src';
import * as tabrisMock from './tabris-mock';
import { restoreSandbox, expect } from './test';
import { CompositeProperties } from 'tabris';

@isolated
class CustomComponent extends Composite {

  @findFirst('.foo')
  public readonly firstFoo: Widget;

  @findLast('.foo')
  public readonly lastFoo: Widget;

  @findAll(Composite)
  public readonly allComposites: WidgetCollection<Composite>;

  @getById
  public readonly foo3: Widget;

  @getByType
  public readonly button: Button;

  @findFirst
  public readonly childCustomComponent: CustomComponent;

  constructor(properties: CompositeProperties, containSelf: boolean) {
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

describe('isolated', () => {

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

  it('does not interfere with finders and getters', () => {
    expect(widget.firstFoo.id).to.equal('foo1');
    expect(widget.lastFoo.id).to.equal('foo3');
    expect(widget.allComposites.length).to.equal(4);
    expect(widget.foo3.id).to.equal('foo3');
    expect(widget.button.id).to.equal('foo4');
    expect(widget.childCustomComponent.id).to.equal('foo5');
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
    @isolated class CustomComponent2 extends CustomComponent {}
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
    expect(widget.button.enabled).to.be.true;
  });

  it('limits apply on parent to widget itself', () => {
    parent.apply({'*': {enabled: false}});
    expect(widget.enabled).to.be.false;
    expect(widget.button.enabled).to.be.true;
  });

  it('allows child selection via _children', () => {
    expect(widget.protectedChildren().length).to.equal(5);
    expect(widget.protectedFind().length).to.equal(5);
  });

  it('allows _apply call to work', () => {
    widget.protectedApply({'*': {enabled: false}});
    expect(widget.button.enabled).to.be.false;
  });

  it('limits _apply on parent to widget itself', () => {
    (parent as any)._apply({'*': {enabled: false}});
    expect(widget.enabled).to.be.false;
    expect(widget.button.enabled).to.be.true;
  });

  it('limits _find on parent to widget itself', () => {
    expect((parent as any).find().length).to.equal(1);
    expect((parent as any).find()[0]).to.equal(widget);
  });

});
