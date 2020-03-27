import 'mocha';
import 'sinon';
import {ChangeListeners, Composite, Properties, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, stub} from './test';
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

  describe('with type guard', () => {

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

    it('throws if type type guard throws', () => {
      const component = new CustomComponent();
      expect(() => component.trueType = false).to.throw(
        'Failed to set property "trueType": only true allowed'
      );
      expect(component.trueType).to.equal(true);
    });

  });

  describe('with type parameter', () => {

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
