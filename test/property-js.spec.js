import 'mocha';
import 'sinon';
import {Composite, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, stub} from './test';
import {event, property} from '../src';

class Example {

  /** @type {Date} */
  @property({type: Date})
  checked;

  @property({
    typeGuard: date => date.getFullYear() > 2000,
    type: Date
  })
  withTypeGuard;

}

class CustomComponent extends Composite {

  /** @type {string} */
  @property foo;

  /** @type {number} */
  @property bar;

  /** @type {number | boolean} */
  @property baz = true;

  /** @type {string} */
  @property(v => ['a', 'b', 'c'].indexOf(v) > -1)
  specificStrings = 'a';

  /** @type {number[] | number} */
  @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
  mixedType = 0;

  /** @type {boolean} */
  @property(v => {if (v !== true) { throw new Error('only true allowed'); } return true;})
  trueType = true;

  /** @param {tabris.Properties<CustomComponent>=} properties */
  constructor(properties) {
    super(properties);
  }

}

class MyModel {
  /** @type {boolean} */
  @property myBool = false;
  /** @type {tabris.ChangeListeners<MyModel, 'myBool'>} */
  @event onOtherPropChanged;
}

class MyModel2 {
  /** @type {boolean} */
  @property myBool = false;
  /** @type {tabris.ChangeListeners<MyModel2, 'myBool'>} */
  @event onMyBoolChanged;
}

describe('property', () => {

  beforeEach(() => {
    tabris._init(new ClientMock());
  });

  it('support set via constructor', () => {
    const component = new CustomComponent({foo: 'foo1', bar: 23});
    expect(component.foo).to.equal('foo1');
    expect(component.bar).to.equal(23);
  });

  it('support set via set method', () => {
    const component = new CustomComponent().set({foo: 'foo1', bar: 23});
    expect(component.foo).to.equal('foo1');
    expect(component.bar).to.equal(23);
  });

  it('fires change event on widget', () => {
    const listener = stub();
    const component = new CustomComponent().on('fooChanged', listener);

    component.foo = 'foo2';

    expect(listener).to.have.been.calledWithMatch({
      target: component, value: 'foo2', type: 'fooChanged'
    });
  });

  it('fires change event on plain object', () => {
    const listener = stub();
    const myModel = new MyModel2();
    myModel.onMyBoolChanged(listener);

    myModel.myBool = true;

    expect(listener).to.have.been.called;
    expect(listener).to.have.been.calledWithMatch({
      target: myModel, value: true, type: 'myBoolChanged'
    });
  });

  it('does not fire event on plain object without matching listeners', () => {
    const listener = stub();
    const myModel = new MyModel();
    myModel.onOtherPropChanged(listener);

    myModel.myBool = true;

    expect(listener).not.to.have.been.called;
  });

  it('do not fire change event if values are identical', () => {
    const listener = stub();
    const component = new CustomComponent({foo: 'foo2'}).on('fooChanged', listener);

    component.foo = 'foo2';

    expect(listener).to.not.have.been.called;
  });

  describe('with type guard', () => {

    it('throws if guard fails', () => {
      const component = new CustomComponent();
      expect(() => component.specificStrings = 'd').to.throw(
        'Failed to set property "specificStrings": Type guard check failed'
      );
      expect(component.specificStrings).to.equal('a');
    });

    it('accepts value if type guard succeeds', () => {
      const component = new CustomComponent();

      component.mixedType = ['a'];

      expect(component.mixedType).to.deep.equal(['a']);
    });

    it('throws if type type guard throws', () => {
      const component = new CustomComponent();
      expect(() => component.trueType = false).to.throw(
        'Failed to set property "trueType": only true allowed'
      );
      expect(component.trueType).to.equal(true);
    });

  });

  describe('with type parameter', () => {

    /** @type {Example} */
    let example;

    beforeEach(() => {
      example = new Example();
    });

    it('throws if type check fails ', () => {
      expect(() => example.checked = {}).to.throw(
        'Failed to set property "checked": Expected value to be of type Date, but found Object'
      );
    });

    it('accepts value if it passes both explicit type and type guard', () => {
      const date1999 = new Date();
      date1999.setFullYear(1999);
      const date2001 = new Date();
      date2001.setFullYear(2001);

      expect(() => example.withTypeGuard = {}).to.throw(
        'Failed to set property "withTypeGuard": Expected value to be of type Date, but found Object'
      );
      expect(() => example.withTypeGuard = date1999).to.throw(
        'Failed to set property "withTypeGuard": Type guard check failed'
      );

      example.withTypeGuard = date2001;

      expect(example.withTypeGuard).to.equal(date2001);
    });

  });

});
