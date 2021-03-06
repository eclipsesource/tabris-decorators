import 'mocha';
import 'sinon';
import 'tabris';
import {expect, restoreSandbox} from './test';
import {InjectionHandlerFunction, Injector} from '../src';

class MyClass {

  constructor(readonly value: any) {}

}

describe('Injector', () => {

  let instance: Injector;
  const numberHandler: InjectionHandlerFunction<number> = () => 23;
  const stringHandler: InjectionHandlerFunction<string> = () => 'foo';

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

  describe('register', () => {

    it('allows to add a shared injectable', () => {
      instance.register(Number, 24);
      expect(instance.resolve(Number)).to.equal(24);
    });

    it('returns value', () => {
      const value = {};
      expect(instance.register(Object, value)).to.equal(value);
    });

  });

  describe('resolve', () => {

    beforeEach(() => {
      instance.addHandler(Number, numberHandler);
      instance.addHandler(String, stringHandler);
    });

    it('throws in no handler exists', () => {
      instance = new Injector();
      expect(() => instance.resolve(Number)).to.throw(
        'Could not inject value of type Number since no compatible injection handler exists for this type.'
      );
    });

    it('returns handler return value', () => {
      expect(instance.resolve(Number)).to.equal(23);
      expect(instance.resolve(String)).to.equal('foo');
    });

    it('can always inject itself', () => {
      expect(instance.resolve(Injector)).to.equal(instance);
    });

    it('passes param', () => {
      instance = new Injector();
      instance.addHandler(String, ({param}) => typeof param === 'string' ? param : '');

      expect(instance.resolve(String, 'bar')).to.equal('bar');
      expect(instance.resolve(String)).to.equal('');
    });

    it('last added handler returning a non-null, non-undefined value wins', () => {
      const numberHandler2 = () => 24;
      instance.addHandler(Number, numberHandler);
      instance.addHandler(Number, numberHandler2);
      instance.addHandler(Number, () => null);
      instance.addHandler(Number, () => undefined);

      expect(instance.resolve(Number)).to.equal(24);
    });

    it('handler with highest priority wins', () => {
      const numberHandler2 = () => 24;
      instance.addHandler({targetType: Number, handler: numberHandler, priority: 1});
      instance.addHandler({targetType: Number, handler: numberHandler2});
      instance.addHandler({targetType: Number, handler: () => null});
      instance.addHandler({targetType: Number, handler: () => undefined});

      expect(instance.resolve(Number)).to.equal(23);
    });

    it('last added handler with same priority wins', () => {
      instance.addHandler({targetType: Number, handler: () => 10, priority: 1});
      instance.addHandler({targetType: Number, handler: () => 11, priority: 3});
      instance.addHandler({targetType: Number, handler: () => 12, priority: 3});
      instance.addHandler({targetType: Number, handler: () => 13, priority: 2});

      expect(instance.resolve(Number)).to.equal(12);
    });

    it('does not cache', () => {
      let i = 0;
      instance = new Injector();
      instance.addHandler(Number, () => i++);

      expect(instance.resolve(Number)).to.equal(0);
      expect(instance.resolve(Number)).to.equal(1);
      expect(instance.resolve(Number)).to.equal(2);
    });

    it('throws for undefined type', () => {
      expect(() => instance.resolve(null as any)).to.throw(
        Error,
        'Could not inject value since type is null.'
      );
    });

    it('supports singleton pattern', () => {
      const serviceObject = new MyClass('foo');
      instance.addHandler(MyClass, () => serviceObject);

      expect(instance.resolve(MyClass)).to.equal(serviceObject);
      expect(instance.resolve(MyClass)).to.equal(instance.resolve(MyClass));
    });

    it('throws for circular dependency', () => {
      class MyClassA {b = instance.resolve(MyClassB);}
      class MyClassB {c = instance.resolve(MyClassC);}
      class MyClassC {a = instance.resolve(MyClassA);}
      instance.addHandler(MyClassA, () => new MyClassA());
      instance.addHandler(MyClassB, () => new MyClassB());
      instance.addHandler(MyClassC, () => new MyClassC());
      instance.addHandler(MyClass, () => new MyClass(1));

      expect(() => instance.resolve(MyClassA)).to.throw(
        Error,
        'Circular dependency injection: MyClassA -> MyClassB -> MyClassC -> MyClassA'
      );
    });

    it('recovers from circular dependency injection', () => {
      let circular = true;
      class MyClassA {b = circular ? instance.resolve(MyClassB) : null;}
      class MyClassB {c = instance.resolve(MyClassC);}
      class MyClassC {a = instance.resolve(MyClassA);}
      instance.addHandler(MyClassA, () => new MyClassA());
      instance.addHandler(MyClassB, () => new MyClassB());
      instance.addHandler(MyClassC, () => new MyClassC());

      expect(() => instance.resolve(MyClassA)).to.throw(Error);
      circular = false;
      expect(() => instance.resolve(MyClassA)).not.to.throw();
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
        bar: string = 'bar';
        constructor(readonly value: any) {}
      }
      instance.addHandler(MyClass, () => new MyClass2('foo'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports identical prototype pattern', () => {
      function MyClass2() { /* no explicit API */ }
      MyClass2.prototype = MyClass.prototype;
      type MyClass2 = MyClass;
      instance.addHandler(MyClass2, () => new MyClass2());

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports implicit subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor(readonly bar: string) {
          super('foo');
        }
      }
      instance.addHandler(MyClass2, () => new MyClass2('bar'));

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass2);
    });

    it('supports multiple implicit subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor() { super('foo'); }
      }
      class MyClass3 extends MyClass {
        constructor() { super('bar'); }
      }
      instance.addHandler(MyClass2, () => new MyClass2());
      instance.addHandler(MyClass3, () => new MyClass3());

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass3);
    });

    it('supports mixed implicit/explicit subclasses pattern', () => {
      class MyClass2 extends MyClass {
        constructor() { super('foo'); }
      }
      class MyClass3 extends MyClass {
        constructor() { super('bar'); }
      }
      instance.addHandler(MyClass, () => new MyClass2());
      instance.addHandler(MyClass3, () => new MyClass3());

      expect(instance.resolve(MyClass)).to.be.instanceof(MyClass3);
    });

  });

  describe('get', () => {

    it('throws for null and undefined', () => {
      expect(() => Injector.get(null)).to.throw();
      expect(() => Injector.get(undefined)).to.throw();
    });

    it('throws for objects not created by an injector', () => {
      expect(() => Injector.get({})).to.throw();
    });

    it('gets injector instance for objects created by create', () => {
      expect(Injector.get(instance.create(Date))).to.equal(instance);
    });

    it('gets injector instance for objects created by resolve', () => {
      instance.addHandler(Date, () => new Date());
      expect(Injector.get(instance.resolve(Date))).to.equal(instance);
    });

    it('gets injector instance for classes marked injectable', () => {
      @instance.injectable
      class Custom {}
      expect(Injector.get(Custom)).to.equal(instance);
    });

    it('gets injector instance for prototype marked injectable', () => {
      @instance.injectable
      class Custom {}
      expect(Injector.get(Custom.prototype)).to.equal(instance);
    });

    it('fails to get injector instance for classes not marked injectable', () => {
      class Custom {}
      expect(() => Injector.get(Custom)).to.throw(
        Error,
        'Can not get injector for a class that is not decorated with @injectable'
      );
    });

  });

});
