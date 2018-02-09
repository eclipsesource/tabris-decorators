/* tslint:disable:no-unused-expression max-classes-per-file */
import 'mocha';
import 'sinon';
import Injector, { InjectionHandler } from '../src/Injector';
import {restoreSandbox, expect} from './test';

class MyClass {

  constructor(readonly value: any) {}

}

describe('Injector', () => {

  let instance: Injector;
  let numberHandler: InjectionHandler<number> = {handleInjection: () => 23};
  let stringHandler: InjectionHandler<string> = {handleInjection: () => 'foo'};

  beforeEach(() => {
    instance = new Injector();
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('addHandler', () => {

    it('allows to add as function', () => {
      instance.addHandler(Number, () => 24);
      expect(instance.resolve(Number)).to.equal(24);
    });

  });

  describe('resolve', () => {

    beforeEach(() => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);
    });

    it('throws in no handler exists', () => {
      instance.reset();
      expect(() => instance.resolve(Number)).to.throw(
        'Can not inject value of type Number since no compatible injection handler exists for this type.'
      );
    });

    it('returns handler return value', () => {
      expect(instance.resolve(Number)).to.equal(23);
      expect(instance.resolve(String)).to.equal('foo');
    });

    it('passes param', () => {
      instance.reset();
      instance.addHandler(String, {handleInjection: ({param}) => param ? param : ''});

      expect(instance.resolve(String, {param: 'bar'})).to.equal('bar');
      expect(instance.resolve(String)).to.equal('');
    });

    it('last added handler returning a non-null, non-undefined value wins', () => {
      let numberHandler2 = {handleInjection: () => 24};
      instance.addHandler(Number, numberHandler);
      instance.addHandler(Number, numberHandler2);
      instance.addHandler(Number, {handleInjection: () => null});
      instance.addHandler(Number, {handleInjection: () => undefined});

      expect(instance.resolve(Number)).to.equal(24);
    });

    it('does not cache', () => {
      let i = 0;
      instance.reset();
      instance.addHandler(Number, {handleInjection: () => i++});

      expect(instance.resolve(Number)).to.equal(0);
      expect(instance.resolve(Number)).to.equal(1);
      expect(instance.resolve(Number)).to.equal(2);
    });

    it('supports singleton pattern', () => {
      let serviceObject = new MyClass('foo');
      instance.addHandler(MyClass, {handleInjection: () => serviceObject});

      expect(instance.resolve(MyClass)).to.equal(serviceObject);
      expect(instance.resolve(MyClass)).to.equal(instance.resolve(MyClass));
    });

    it('supports subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor(readonly bar: string) {
          super('foo');
        }
      }
      instance.addHandler(MyClass, {handleInjection: () => new MyClass2('bar')});

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports equal interface pattern', () => {
      class MyClass2 {
        public bar: string = 'bar';
        constructor(readonly value: any) {}
      }
      instance.addHandler(MyClass, {handleInjection: () => new MyClass2('foo')});

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports identical prototype pattern', () => {
      function MyClass2() { /* no explicit API */ }
      MyClass2.prototype = MyClass.prototype;
      type MyClass2 = MyClass;
      instance.addHandler(MyClass2, {handleInjection: () => new MyClass2()});

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

  });

});
