/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/
import 'mocha';
import 'sinon';
import InjectionHandlerCollection from '../src/InjectionHandlerCollection';
import {injectionHandlers, inject} from '../src';
import {restoreSandbox, expect} from './test';

class MyServiceClass {
  constructor(readonly param: string | undefined) { }
}

class MyUnusedServiceClass {}

class MyClientClass {
  @inject public readonly injectedClass: MyServiceClass;
  @inject('foo') public readonly fooClass: MyServiceClass;
  @inject public readonly unregisteredType: MyUnusedServiceClass;
  @inject public readonly aNumber: number;
  @inject public readonly aString: string;
  @inject public readonly aBoolean: boolean;
}

describe('inject', () => {

  let instance: MyClientClass;
  let serviceHandler: (param: any) => MyServiceClass;
  let numberHandler: (param: any) => number | Number;
  let stringHandler: (param: any) => string | String;
  let booleanHandler: (param: any) => boolean | Boolean;

  injectionHandlers.add(MyServiceClass, (param) => serviceHandler(param));
  injectionHandlers.add(Number, (param) => numberHandler(param));
  injectionHandlers.add(String, (param) => stringHandler(param));
  injectionHandlers.add(Boolean, (param) => booleanHandler(param));

  beforeEach(() => {
    instance = new MyClientClass();
    serviceHandler = (param) => new MyServiceClass(param);
    numberHandler = (param: any) => 0;
    stringHandler = (param: any) => '';
    booleanHandler = (param: any) => false;
  });

  afterEach(() => {
    restoreSandbox();
  });

  it('decoration fails for type that can not be inferred', () => {
    expect(() => {
      class MyClientClass2 {
        @inject
        public readonly unknownType: string | null;
      }
    }).to.throw(
        'Could not apply decorator "inject" to property "unknownType": Type could not be inferred. '
      + 'Only classes and primitive types are supported.'
    );
  });

  describe('static injections', () => {

    it('inject by type', () => {
      expect(instance.injectedClass).to.be.instanceOf(MyServiceClass);
    });

    it('caches value', () => {
      expect(instance.injectedClass).to.be.equal(instance.injectedClass);
    });

    it('caches value per instance', () => {
      expect(new MyClientClass().injectedClass).not.to.equal(instance.injectedClass);
    });

    it('throws if handler does not exist (yet)', () => {
      expect(() => instance.unregisteredType).to.throw(
          'Decorator "inject" could not resolve property "unregisteredType": '
        + 'Can not inject value of type MyUnusedServiceClass since no injection handler exists for this type.'
      );
    });

    it('supports falsy primitives', () => {
      expect(instance.aBoolean).to.be.false;
      expect(instance.aNumber).to.equal(0);
      expect(instance.aString).to.equal('');
    });

    it('unboxes primitives', () => {
      numberHandler = (param: any) => new Number(23);
      stringHandler = (param: any) => new String('foo');
      booleanHandler = (param: any) => new Boolean('true');

      expect(instance.aNumber.valueOf()).to.equal(23);
      expect(instance.aString.valueOf()).to.equal('foo');
      expect(instance.aBoolean.valueOf()).to.equal(true);
      expect(instance.aNumber).not.to.be.instanceof(Number);
      expect(instance.aNumber).not.to.be.instanceof(String);
      expect(instance.aNumber).not.to.be.instanceof(Boolean);
    });

    it('direct use', () => {
      class MySpecialClass {
        public readonly service: MyServiceClass;
        public readonly num: Number;
        constructor(props: {service: MyServiceClass, num: Number}) {
          Object.assign(this, props);
        }
      }

      let special = new MySpecialClass({
        service: inject(MyServiceClass, 'foo'),
        num: inject(Number)
      });

      expect(special.service.param).to.equal('foo');
      expect(special.num).to.equal(0);
    });

  });

  describe('dynamic injections', () => {

    it('default param is undefined', () => {
      expect(instance.injectedClass.param).to.be.undefined;
    });

    it('passes param', () => {
      expect(instance.fooClass.param).to.be.equal('foo');
    });

  });

});
