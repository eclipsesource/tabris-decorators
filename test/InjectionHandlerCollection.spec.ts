import 'mocha';
import 'sinon';
import InjectionHandlerCollection from '../src/InjectionHandlerCollection';
import {restoreSandbox, expect} from './test';

/* tslint:disable:no-unused-expression max-classes-per-file */

class MyClass {

  constructor(readonly value: any) {}

}

describe('InjectionHandlerCollection', () => {

  let instance: InjectionHandlerCollection;
  let numberHandler = () => 23;
  let stringHandler = () => 'foo';

  beforeEach(() => {
    instance = new InjectionHandlerCollection();
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('add', () => {

    it('stores handler', () => {
      instance.add(Number, numberHandler);

      expect(instance.get(Number)).to.equal(numberHandler);
    });

    it('allows to add again for different type', () => {
      instance.add(Number, numberHandler);
      instance.add(String, stringHandler);

      expect(instance.get(Number)).to.equal(numberHandler);
      expect(instance.get(String)).to.equal(stringHandler);
    });

    it('does not allow to add again for same type', () => {
      instance.add(Number, numberHandler);

      expect(() => instance.add(Number, numberHandler)).to.throw(
        'InjectionHandlerCollection already has a handler for Number'
      );
    });

    it('does allow to add again after removing previous handler', () => {
      let numberHandler2 = () => 24;
      instance.add(Number, numberHandler);
      instance.remove(Number);

      instance.add(Number, numberHandler2);

      expect(instance.get(Number)).to.equal(numberHandler2);
    });

  });

  describe('remove', () => {

    it('removes handler', () => {
      let originalEntry = instance.get(Number);
      instance.add(Number, numberHandler);

      instance.remove(Number);

      expect(originalEntry).to.be.null;
      expect(instance.get(Number)).to.be.null;
    });

    it('is ignored if entry does not exists', () => {
      expect(instance.remove(Number)).not.throw;
    });

    it('throws if handler was alrady used', () => {
      instance.add(Number, numberHandler);
      instance.add(String, stringHandler);
      instance.resolve(String);

      expect(() => instance.remove(Number)).not.to.throw;
      expect(() => instance.remove(String)).to.throw(
        'Can not remove InjectionHandler for type String because it was already used.'
      );
    });

  });

  describe('clear', () => {

    it('removes all handlers', () => {
      instance.add(Number, numberHandler);
      instance.add(String, stringHandler);

      instance.clear();

      expect(instance.get(Number)).to.be.null;
      expect(instance.get(String)).to.be.null;
    });

    it('ignored if entry does not exists', () => {
      expect(instance.remove(Number)).not.throw;
    });

    it('throws if handler was alrady used', () => {
      instance.add(Number, numberHandler);
      instance.add(String, stringHandler);
      instance.resolve(String);

      expect(() => instance.clear()).to.throw(
        'Can not clear InjectionHandlerCollection because InjectionHandler for type String was already used.'
      );
    });

  });

  describe('resolve', () => {

    beforeEach(() => {
      instance.add(Number, numberHandler);
      instance.add(String, stringHandler);
    });

    it('throws in no handler exists', () => {
      instance.remove(Number);
      expect(() => instance.resolve(Number)).to.throw(
        'Can not inject value of type Number since no injection handler exists for this type.'
      );
    });

    it('returns handler return value', () => {
      expect(instance.resolve(Number)).to.equal(23);
      expect(instance.resolve(String)).to.equal('foo');
    });

    it('passes param', () => {
      instance.remove(String);
      instance.add(String, (param) => param ? param : '');

      expect(instance.resolve(String, 'bar')).to.equal('bar');
      expect(instance.resolve(String)).to.equal('');
    });

    it('does not cache', () => {
      let i = 0;
      instance.remove(Number);
      instance.add(Number, () => i++);

      expect(instance.resolve(Number)).to.equal(0);
      expect(instance.resolve(Number)).to.equal(1);
      expect(instance.resolve(Number)).to.equal(2);
    });

    it('supports singleton pattern', () => {
      let serviceObject = new MyClass('foo');
      instance.add(MyClass, () => serviceObject);

      expect(instance.resolve(MyClass)).to.equal(serviceObject);
      expect(instance.resolve(MyClass)).to.equal(instance.resolve(MyClass));
    });

    it('supports subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor(readonly bar: string) {
          super('foo');
        }
      }
      instance.add(MyClass, () => new MyClass2('bar'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports equal interface pattern', () => {
      class MyClass2 {
        public bar: string = 'bar';
        constructor(readonly value: any) {}
      }
      instance.add(MyClass, () => new MyClass2('foo'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

  });

});
