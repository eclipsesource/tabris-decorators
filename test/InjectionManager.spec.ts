/* tslint:disable:no-unused-expression max-classes-per-file */
import 'mocha';
import 'sinon';
import InjectionManager from '../src/InjectionManager';
import {restoreSandbox, expect} from './test';

class MyClass {

  constructor(readonly value: any) {}

}

describe('InjectionManager', () => {

  let instance: InjectionManager;
  let numberHandler = () => 23;
  let stringHandler = () => 'foo';

  beforeEach(() => {
    instance = new InjectionManager();
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('add', () => {

    it('stores handler', () => {
      instance.addHandler(Number, numberHandler);

      expect(instance.getHandler(Number)).to.equal(numberHandler);
    });

    it('allows to add again for different type', () => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);

      expect(instance.getHandler(Number)).to.equal(numberHandler);
      expect(instance.getHandler(String)).to.equal(stringHandler);
    });

    it('does not allow to add again for same type', () => {
      instance.addHandler(Number, numberHandler);

      expect(() => instance.addHandler(Number, numberHandler)).to.throw(
        'InjectionManager already has a handler for Number'
      );
    });

    it('does allow to add again after removing previous handler', () => {
      let numberHandler2 = () => 24;
      instance.addHandler(Number, numberHandler);
      instance.removeHandler(Number);

      instance.addHandler(Number, numberHandler2);

      expect(instance.getHandler(Number)).to.equal(numberHandler2);
    });

  });

  describe('remove', () => {

    it('removes handler', () => {
      let originalEntry = instance.getHandler(Number);
      instance.addHandler(Number, numberHandler);

      instance.removeHandler(Number);

      expect(originalEntry).to.be.null;
      expect(instance.getHandler(Number)).to.be.null;
    });

    it('is ignored if entry does not exists', () => {
      expect(instance.removeHandler(Number)).not.throw;
    });

    it('throws if handler was alrady used', () => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);
      instance.resolve(String);

      expect(() => instance.removeHandler(Number)).not.to.throw;
      expect(() => instance.removeHandler(String)).to.throw(
        'Can not remove InjectionHandler for type String because it was already used.'
      );
    });

  });

  describe('clear', () => {

    it('removes all handlers', () => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);

      instance.clearHandlers();

      expect(instance.getHandler(Number)).to.be.null;
      expect(instance.getHandler(String)).to.be.null;
    });

    it('ignored if entry does not exists', () => {
      expect(instance.removeHandler(Number)).not.throw;
    });

    it('throws if handler was alrady used', () => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);
      instance.resolve(String);

      expect(() => instance.clearHandlers()).to.throw(
        'Can not clear InjectionManager because InjectionHandler for type String was already used.'
      );
    });

  });

  describe('resolve', () => {

    beforeEach(() => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);
    });

    it('throws in no handler exists', () => {
      instance.removeHandler(Number);
      expect(() => instance.resolve(Number)).to.throw(
        'Can not inject value of type Number since no injection handler exists for this type.'
      );
    });

    it('returns handler return value', () => {
      expect(instance.resolve(Number)).to.equal(23);
      expect(instance.resolve(String)).to.equal('foo');
    });

    it('passes param', () => {
      instance.removeHandler(String);
      instance.addHandler(String, (param) => param ? param : '');

      expect(instance.resolve(String, 'bar')).to.equal('bar');
      expect(instance.resolve(String)).to.equal('');
    });

    it('does not cache', () => {
      let i = 0;
      instance.removeHandler(Number);
      instance.addHandler(Number, () => i++);

      expect(instance.resolve(Number)).to.equal(0);
      expect(instance.resolve(Number)).to.equal(1);
      expect(instance.resolve(Number)).to.equal(2);
    });

    it('supports singleton pattern', () => {
      let serviceObject = new MyClass('foo');
      instance.addHandler(MyClass, () => serviceObject);

      expect(instance.resolve(MyClass)).to.equal(serviceObject);
      expect(instance.resolve(MyClass)).to.equal(instance.resolve(MyClass));
    });

    it('supports subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor(readonly bar: string) {
          super('foo');
        }
      }
      instance.addHandler(MyClass, () => new MyClass2('bar'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports equal interface pattern', () => {
      class MyClass2 {
        public bar: string = 'bar';
        constructor(readonly value: any) {}
      }
      instance.addHandler(MyClass, () => new MyClass2('foo'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

  });

});
