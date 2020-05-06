import 'mocha';
import 'sinon';
import {ChangeListeners, Color, ColorValue, Composite, Properties, tabris} from 'tabris';
import {expect, spy} from './test';
import {event, prop} from '../src';

describe('prop', () => {

  let listener: sinon.SinonSpy;

  beforeEach(() => {
    listener = spy();
  });

  describe('with no options', () => {

    class Example {

      @event onFooChanged: ChangeListeners<this, 'foo'>;
      @prop foo: string;

      @event onBarChanged: ChangeListeners<this, 'bar'>;
      @(prop as any)() bar: number;

      @event onBazChanged: ChangeListeners<this, 'baz'>;
      @prop({}) baz: boolean;

      @event onColorChanged: ChangeListeners<this, 'color'>;
      @prop(Color)
      color: ColorValue;
    }

    let example: Example;

    beforeEach(() => {
      example = new Example();
    });

    it('fires change events', () => {
      example.onFooChanged(listener);
      example.foo = 'foo';
      expect(listener).to.have.been.calledOnce;
    });

    it('uses shorthand for type', () => {
      expect(() => example.color = 'foo').to.throw;
      expect(() => example.color = Color.from('red')).not.to.throw;
    });

    it('uses "auto" convert', () => {
      (example as any).foo = 1;
      (example as any).bar = '2';
      (example as any).baz = 'true';
      example.color = 'red';

      expect(example.foo).to.equal('1');
      expect(example.bar).to.equal(2);
      expect(example.baz).to.be.true;
      expect(example.color).to.be.instanceOf(Color);
    });

    it('uses "auto" equals with type', () => {
      example.color = Color.from('red');
      example.onFooChanged(listener);

      example.color = Color.from('red');

      expect(listener).not.to.have.been.called;
    });

    it('sets "default" depending on property type', () => {
      expect(example.foo).to.equal('');
      expect(example.bar).to.equal(0);
      expect(example.baz).to.equal(false);
      expect(example.color).to.be.null;
    });

    it('is not nullable', () => {
      example.foo = 'foo';
      example.foo = null;
      example.bar = 1;
      example.bar = null;
      example.baz = true;
      example.baz = null;

      expect(example.foo).to.equal('');
      expect(example.bar).to.equal(0);
      expect(example.baz).to.equal(false);
      expect(() => example.color = null).to.throw(Error, 'not nullable');
    });

  });

  describe('with "convert" option', () => {

    class ConvertExample {

      @prop({convert: 'off'})
      off: number;

      @prop({convert: value => parseInt(value as any) + 2})
      plusTwo: number;

    }

    let example: ConvertExample;

    beforeEach(() => {
      example = new ConvertExample();
    });

    it('set to "off"', () => {
      expect(() => (example as any).off = '3').to.throw(Error);
    });

    it('set to function', () => {
      (example as any).plusTwo = '23';
      expect(example.plusTwo).to.equal(25);
    });

  });

  describe('with "equals" option', () => {

    class EqualsExample {

      @event onStrictChanged: ChangeListeners<this, 'strict'>;
      @prop({equals: 'strict'})
      strict: Date;

      @event onTimeChanged: ChangeListeners<this, 'time'>;
      @prop({
        equals: (a: Date, b: Date) => (a && a.getHours()) === (b && b.getHours())
      })
      time: Date;

    }

    let example: EqualsExample;
    let dateA: Date;
    let dateB: Date;

    beforeEach(() => {
      example = new EqualsExample();
      dateA = new Date(0);
      dateB = new Date(0);
    });

    it('set to strict', () => {
      example.strict = dateA;
      example.onStrictChanged(listener);

      example.strict = dateB;

      expect(example.strict).to.equal(dateB);
      expect(listener).to.have.been.calledOnce;
    });

    it('set to custom function', () => {
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

  describe('with "default" option', () => {

    class DefaultValueExample {

      @prop({default: 1})
      one: number;

      @prop({default: '2'})
      two: number;

    }

    let example: DefaultValueExample;

    beforeEach(() => {
      example = new DefaultValueExample();
    });

    it('initializes with default value', () => {
      expect(example.one).to.equal(1);
    });

    it('converts default on initialization', () => {
      expect(example.two).to.equal(2);
    });

    it('supports reset', () => {
      example.one = 2;
      example.one = null;
      expect(example.one).to.equal(1);
    });

  });

  describe('with nullable option', () => {

    class NullableExample {

      @prop({nullable: null})
      default: Date = new Date();

      @prop({nullable: true})
      nullable: Date = new Date();

    }

    let example: NullableExample;

    beforeEach(() => {
      example = new NullableExample();
    });

    it('disallows null by default', () => {
      expect(() => example.default = null).to.throw(Error, 'not nullable');
    });

    it('true allows null', () => {
      example.nullable = null;
      expect(example.nullable).to.be.null;
    });

  });

});
