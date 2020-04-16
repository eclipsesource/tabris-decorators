import 'mocha';
import 'sinon';
import {ChangeListeners, Color, ColorValue, Composite, Properties, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, spy, stub} from './test';
import {event, property} from '../src';

describe('property', () => {

  class CustomComponent extends Composite {

    @property foo: string;

    @property bar: number;

    @property baz: number | boolean = true;

    @property(v => ['a', 'b', 'c'].indexOf(v as string) > -1)
    specificStrings: string = 'a';

    @property(v => v instanceof Array || (!isNaN(v as number) && v >= 0))
    mixedType: number[] | number = 0;

    @property(v => {if (v !== true) { throw new Error('only true allowed'); } return true;})
    trueType: boolean = true;

    constructor(properties?: Properties<CustomComponent>) {
      super(properties);
    }

  }

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
    class MyModel {
      @property myBool: boolean = false;
      @event onMyBoolChanged: ChangeListeners<MyModel, 'myBool'>;
    }
    const myModel = new MyModel();
    myModel.onMyBoolChanged(listener);

    myModel.myBool = true;

    expect(listener).to.have.been.called;
    expect(listener).to.have.been.calledWithMatch({
      target: myModel, value: true, type: 'myBoolChanged'
    });
  });

  it('does not fire event on plain object without matching listeners', () => {
    const listener = stub();
    class MyModel {
      @property myBool: boolean = false;
      @event onOtherPropChanged: ChangeListeners<MyModel, 'myBool'>;
    }
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

  it('throws if type check fails on checkable type', () => {
    const component = new CustomComponent({foo: 'foo', bar: 23}) as any;
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
    const component = new CustomComponent() as any;

    component.baz = 'foo';

    expect(component.baz).to.equal('foo');
  });

  describe('with typeGuard option', () => {

    it('throws if type standard check would succeed but type guard fails', () => {
      const component = new CustomComponent();
      expect(() => component.specificStrings = 'd').to.throw(
        'Failed to set property "specificStrings": Type guard check failed'
      );
      expect(component.specificStrings).to.equal('a');
    });

    it('accepts value if type standard check is not possible but type guard succeeds', () => {
      const component = new CustomComponent();

      component.mixedType = [];
      component.mixedType = 12;

      expect(component.mixedType).to.equal(12);
    });

    it('throws if type standard check is not possible but type guard fails', () => {
      const component = new CustomComponent();
      expect(() => component.mixedType = -1).to.throw(
        'Failed to set property "mixedType": Type guard check failed'
      );
      expect(component.specificStrings).to.equal('a');
    });

    it('accepts value if type standard check would fail but type guard succeeds', () => {
      const component = new CustomComponent();

      (component as any).mixedType = ['a'];

      expect(component.mixedType).to.deep.equal(['a']);
    });

    it('throws if type guard throws', () => {
      const component = new CustomComponent();
      expect(() => component.trueType = false).to.throw(
        'Failed to set property "trueType": only true allowed'
      );
      expect(component.trueType).to.equal(true);
    });

  });

  describe('with type option', () => {

    class Example {

      @property({type: Date as any})
      explicitTypeStricter: number;

      @property({type: Object})
      implicitTypeStricter: Date;

      @property({
        typeGuard: date => date.getFullYear() > 2000,
        type: Date
      })
      withTypeGuard: any;

    }

    let example: Example;

    beforeEach(() => {
      example = new Example();
    });

    it('throws only if explicit type check fails ', () => {
      expect(() => (example as any).implicitTypeStricter = {}).not.to.throw();
      expect(() => (example.explicitTypeStricter as any) = {}).to.throw(
        'Failed to set property "explicitTypeStricter": Expected value to be of type Date, but found Object'
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

      @property({convert: 'auto'})
      auto: string;

      @property({convert: 'off'})
      none: number;

      @property({convert: null})
      off: number;

      @property({convert: value => parseInt(value as any) + 2})
      plusTwo: number;

      @property({convert: (() => { throw new Error('foo'); }) as any})
      fail: number;

      @property({convert: v => String(v)})
      buggy: number;

      @property({
        type: Number,
        convert: v => parseInt(String(v)) - 100,
        typeGuard: v => v > 0
      })
      withTypeGuard: any;

      @event onColorChanged: ChangeListeners<this, 'color'>;

      @property({type: Color, convert: 'auto', equals: 'auto'})
      color: ColorValue;

      @property({convert: 'auto'})
      notype: any;

    }

    let example: ConvertExample;

    beforeEach(() => {
      example = new ConvertExample();
    });

    it('is off by default', () => {
      expect(() => (example.none as any) = '3').to.throw(Error);
    });

    it('"off" rejects incorrect type', () => {
      example.off = 2;
      try {
        (example as any).off = '3';
        throw new Error('unexpected');
      } catch (ex) {
        expect(ex.message).to.include('Expected value "3" to be of type number');
      } finally {
        expect(example.off).to.equal(2);
      }
    });

    it('"auto" converts automatically', () => {
      (example as any).auto = {toString: () => 'foo'};
      expect(example.auto).to.equal('foo');
    });

    it('"auto" converts null for primitive type', () => {
      example.auto = 'foo';
      example.auto = null;
      expect(example.auto).to.equal('');
    });

    it('"auto" skips null for object type', () => {
      example.color = Color.from('red');
      example.color = null;
      expect(example.color).to.equal(null);
    });

    it('converter is called for incorrect type', () => {
      (example as any).plusTwo = '23';
      expect(example.plusTwo).to.equal(25);
    });

    it('converter is called for null', () => {
      (example as any).plusTwo = null;
      expect(example.plusTwo).to.be.NaN;
    });

    it('converter is not called for correct type', () => {
      example.plusTwo = 23;
      expect(example.plusTwo).to.equal(23);
    });

    it('converter return type is checked', () => {
      expect(() => (example as any).buggy = true).to.throw(Error, 'type number');
    });

    it('type guard is called with return value', () => {
      example.withTypeGuard = 200;
      expect(example.withTypeGuard).to.equal(200);
      expect(() => example.withTypeGuard = '99').to.throw(Error, 'guard check failed');
    });

    it('converter error propagates', () => {
      expect(() => (example as any).fail = '23').to.throw(Error, 'foo');
    });

    it('works with ColorValue', () => {
      example.color = 'rgb(0, 1, 2)';
      expect(example.color.toString()).to.equal('rgb(0, 1, 2)');
    });

    it('fires change event with converted value', () => {
      let changeValue: ColorValue = null;
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

    it('warns if no type information is given', () => {
      spy(console, 'warn');

      example.notype = true;
      example.notype = false;

      expect(console.warn).to.have.been.calledOnceWith(
        'Property "notype" of class "ConvertExample" requires an explicit type to function correctly'
      );

    });

  });

  describe('with equals option', () => {

    class EqualsExample {

      @event onDefaultChanged: ChangeListeners<this, 'default'>;
      @property({equals: null})
      default: Date;

      @event onStrictChanged: ChangeListeners<this, 'strict'>;
      @property({equals: 'strict'})
      strict: Date;

      @event onAutoChanged: ChangeListeners<this, 'auto'>;
      @property({equals: 'auto'})
      auto: Date;

      @event onTimeChanged: ChangeListeners<this, 'time'>;
      @property({
        equals: (a: Date, b: Date) => (a && a.getHours()) === (b && b.getHours())
      })
      time: Date;

    }

    let example: EqualsExample;
    let dateA: Date;
    let dateB: Date;
    let listener: () => void;

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

  describe('twice', () => {

    it('does not throw', () => {
      expect(() => {
        class A {
          @property @property
          foo: string;
        }
      }).not.to.throw(Error);
    });

    it('throws when changing user type', () => {
      expect(() => {
        class A {
          @property({type: String})
          @property({type: Composite as any})
          foo: string;
        }
      }).to.throw(Error);
    });

    it('does not throws when adding type guard', () => {
      expect(() => {
        class A {
          @property(() => true)
          @property(() => true)
          foo: string;
        }
      }).not.to.throw(Error);
    });

    it('chains type guard', () => {
      class A {
        @property(value => value !== null)
        @property((value: string) => value.length > 0)
        @property((value: string) => value !== 'bar')
        foo: string;
      }
      const a = new A();

      expect(() => a.foo = null).to.throw(Error, 'check failed');
      expect(() => a.foo = '').to.throw(Error, 'check failed');
      expect(() => a.foo = 'bar').to.throw(Error, 'check failed');
      expect(() => a.foo = undefined).not.to.throw(Error);
      expect(() => a.foo = 'foo').not.to.throw(Error);
    });

  });

});
