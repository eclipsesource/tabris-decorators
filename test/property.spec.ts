import 'mocha';
import 'sinon';
import { Composite, CompositeProperties } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox, stub } from './test';
import { property } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */

describe('property', () => {

  type CustomComponentProperties = CompositeProperties & {foo?: string, bar?: number};

  class CustomComponent extends Composite {

    @property public foo: string;

    @property public bar: number;

    @property public baz: number | boolean = true;

    @property(v => ['a', 'b', 'c'].indexOf(v) > -1)
    public specificStrings: string = 'a';

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    public mixedType: number[] | number = 0;

    @property(v => {if (v !== true) { throw new Error('only true allowed'); } return true;})
    public trueType: boolean = true;

    constructor(properties?: CustomComponentProperties) {
      super(properties);
    }

  }

  interface CustomComponent {

    set(properties: CustomComponentProperties): this;
    set(property: string, value: any): this;

  }

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  it('support set via constructor', () => {
    let component = new CustomComponent({foo: 'foo1', bar: 23});
    expect(component.foo).to.equal('foo1');
    expect(component.bar).to.equal(23);
  });

  it('support set via set method', () => {
    let component = new CustomComponent().set({foo: 'foo1', bar: 23});
    expect(component.foo).to.equal('foo1');
    expect(component.bar).to.equal(23);
  });

  it('fires change event', () => {
    let listener = stub();
    let component = new CustomComponent().on('fooChanged', listener);

    component.foo = 'foo2';

    expect(listener).to.have.been.calledWithMatch({
      target: component, value: 'foo2', type: 'fooChanged'
    });
  });

  it('do not fire change event if values are identical', () => {
    let listener = stub();
    let component = new CustomComponent({foo: 'foo2'}).on('fooChanged', listener);

    component.foo = 'foo2';

    expect(listener).to.not.have.been.called;
  });

  it('throws if type check fails on checkable type', () => {
    let component = new CustomComponent({foo: 'foo', bar: 23}) as any;
    expect(() => component.foo = 24).to.throw(
      'Failed to set property "foo": Expected value "24" to be of type string, but found number'
    );
    expect(() => component.bar = 'foo2').to.throw(
      'Failed to set property "bar": Expected value "foo2" to be of type number, but found string'
    );
    expect(component.foo).to.equal('foo');
    expect(component.bar).to.equal(23);
  });

  it('does no type check on uncheckable type', () => {
    let component = new CustomComponent() as any;

    component.baz = 'foo';

    expect(component.baz).to.equal('foo');
  });

  it('throws if type standard check would succeed but type guard fails', () => {
    let component = new CustomComponent();
    expect(() => component.specificStrings = 'd').to.throw(
      'Failed to set property "specificStrings": Type guard check failed'
    );
    expect(component.specificStrings).to.equal('a');
  });

  it('accepts value if type standard check is not possible but type guard succeeds', () => {
    let component = new CustomComponent();

    component.mixedType = [];
    component.mixedType = 12;

    expect(component.mixedType).to.equal(12);
  });

  it('throws if type standard check is not possible but type guard fails', () => {
    let component = new CustomComponent();
    expect(() => component.mixedType = -1).to.throw(
      'Failed to set property "mixedType": Type guard check failed'
    );
    expect(component.specificStrings).to.equal('a');
  });

  it('accepts value if type standard check would fail but type guard succeeds', () => {
    let component = new CustomComponent();

    (component as any).mixedType = ['a'];

    expect(component.mixedType).to.deep.equal(['a']);
  });

  it('throws if type type guard throws', () => {
    let component = new CustomComponent();
    expect(() => component.trueType = false).to.throw(
      'Failed to set property "trueType": only true allowed'
    );
    expect(component.trueType).to.equal(true);
  });

});
