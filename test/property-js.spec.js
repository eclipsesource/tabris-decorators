import 'mocha';
import 'sinon';
import {Composite, tabris, Color} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, stub, spy, restoreSandbox} from './test';
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
  /** @type {boolean} */
  @property otherProp = false;
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

  afterEach(() => restoreSandbox());

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

  describe('with convert option', () => {

    class ConvertExample {

      @property({type: String, convert: 'auto'})
      auto;

      @property({type: Number, convert: 'off'})
      none;

      @property({type: Number, convert: null})
      off;

      @property({type: Number, convert: value => parseInt(value) + 2})
      plusTwo;

      @property({type: Number, convert: (() => { throw new Error('foo'); })})
      fail;

      @property({type: Number, convert: v => String(v)})
      buggy;

      @property({convert: v => v + 1})
      noType;

      @property({
        type: Number,
        convert: v => parseInt(String(v)) - 100,
        typeGuard: v => v > 0
      })
      withTypeGuard;

      @event onColorChanged;

      @property({type: Color, convert: 'auto', equals: 'auto'})
      color;

    }

    let example;

    beforeEach(() => {
      example = new ConvertExample();
    });

    it('is off by default', () => {
      expect(() => example.none = '3').to.throw(Error);
    });

    it('"off" rejects incorrect type', () => {
      example.off = 2;
      try {
        example.off = '3';
        throw new Error('unexpected');
      } catch (ex) {
        expect(ex.message).to.include('Expected value "3" to be of type number');
      } finally {
        expect(example.off).to.equal(2);
      }
    });

    it('"auto" converts automatically', () => {
      example.auto = {toString: () => 'foo'};
      expect(example.auto).to.equal('foo');
    });

    it('converter is called for incorrect type', () => {
      example.plusTwo = '23';
      expect(example.plusTwo).to.equal(25);
    });

    it('converter is not called for correct type', () => {
      example.plusTwo = 23;
      expect(example.plusTwo).to.equal(23);
    });

    it('warns if no type information is given', () => {
      spy(console, 'warn');

      example.noType = true;
      example.noType = false;

      expect(console.warn).to.have.been.calledOnceWith(
        'Property "noType" of class "ConvertExample" requires an explicit type to function correctly'
      );
    });

    it('converter return type is checked', () => {
      expect(() => example.buggy = true).to.throw(Error, 'type number');
    });

    it('type guard is called with return value', () => {
      example.withTypeGuard = 200;
      expect(example.withTypeGuard).to.equal(200);
      expect(() => example.withTypeGuard = '99').to.throw(Error, 'guard check failed');
    });

    it('converter error propagates', () => {
      expect(() => example.fail = '23').to.throw(Error, 'foo');
    });

    it('works with ColorValue', () => {
      example.color = 'rgb(0, 1, 2)';
      expect(example.color.toString()).to.equal('rgb(0, 1, 2)');
    });

    it('fires change event with converted value', () => {
      let changeValue = null;
      example.onColorChanged(ev => changeValue = ev.value);

      example.color = 'rgb(0, 1, 2)';

      expect(changeValue).to.be.instanceOf(Color);
      expect(example.color).to.equal(changeValue);
    });

    it('detects change after conversion', () => {
      const listener = spy();
      example.color = 'rgb(0, 1, 2)';
      example.onColorChanged(listener);

      example.color = 'rgb(0, 1, 2)';

      expect(listener).not.to.have.been.called;
    });

  });

  describe('with equals option', () => {

    class EqualsExample {

      @event onDefaultChanged;
      @property({equals: null})
      default;

      @event onStrictChanged;
      @property({equals: 'strict'})
      strict;

      @event onAutoChanged;
      @property({equals: 'auto'})
      auto;

      @event onTimeChanged;
      @property({
        equals: (a, b) => (a && a.getHours()) === (b && b.getHours())
      })
      time;

    }

    let example;
    let dateA;
    let dateB;
    let listener;

    beforeEach(() => {
      example = new EqualsExample();
      dateA = new Date(0);
      dateB = new Date(0);
      listener = spy();
    });

    it('is strict by default', () => {
      example.default = dateA;
      example.onDefaultChanged(listener);

      example.default = dateB;

      expect(example.default).to.equal(dateB);
      expect(listener).to.have.been.calledOnce;
    });

    it('"strict" always fires events unless values are identical', () => {
      example.strict = dateA;
      example.onStrictChanged(listener);

      example.strict = dateB;
      example.strict = dateA;
      example.strict = dateA;
      example.strict = dateB;

      expect(example.strict).to.equal(dateB);
      expect(listener).to.have.been.calledThrice;
    });

    it('"auto" fires no change events if values are detected as equal', () => {
      example.auto = dateA;
      example.onAutoChanged(listener);

      example.auto = dateB;
      example.auto = dateA;
      example.auto = dateB;

      expect(example.auto).to.equal(dateA);
      expect(listener).not.to.have.been.called;
    });

    it('custom function is supported', () => {
      dateA.setHours(20);
      dateB.setHours(21);
      const dateC = new Date(dateB);
      dateC.setFullYear(2000);
      example.time = dateA;
      example.onTimeChanged(listener);

      example.time = dateB;
      example.time = dateC;

      expect(example.time).to.equal(dateB);
      expect(listener).to.have.been.calledOnce;
    });

  });

});
