/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/
import 'mocha';
import 'sinon';
import {Composite, CompositeProperties} from 'tabris';
import {restoreSandbox, expect, spy} from './test';
import {injector, inject, injectable} from '../src';
import * as tabrisMock from './tabris-mock';
import { InjectionHandler, Injection, injectionHandler } from '../src/Injector';
import { SinonSpy } from 'sinon';

const create = injector.create;

class MyServiceClass {
  constructor(readonly param: string | undefined) { }
}

@injectable(true) class MySingletonClass {}

@injectable class MyInjectableClass {

  @inject public singleton: MySingletonClass;

}

class BaseClass {
  public saySomething() { return 'baz1'; }
}

@injectable
class SubClass extends BaseClass {
  public saySomething() { return 'baz2'; }
}

class CompatibleClass {
  public saySomething() { return 'baz3'; }
}

class MyClientClass {
  @inject public readonly injectedClass: MyServiceClass;
  @inject public readonly autoInjectableClass: MyInjectableClass;
  @inject public readonly subClass: BaseClass;
  @inject public readonly compatibleClass: CompatibleClass;
  @inject public readonly singleton: MySingletonClass;
  @inject('foo') public readonly fooClass: MyServiceClass;
  @inject public readonly aNumber: number;
  @inject public readonly aString: string;
  @inject public readonly aBoolean: boolean;
}

class ConstructorWithInjection {

  public service: MyServiceClass;
  public number: number;
  public str: string;

  constructor(
    str: string | undefined,
    @inject('foo2') service: MyServiceClass,
    @inject number: number,
    @inject public otherService: MyServiceClass
  ) {
    this.str = str || '';
    this.number = number || 0;
    this.service = service;
  }

}

describe('inject', () => {

  let instance: MyClientClass;
  let serviceHandler: (injection: Injection) => MyServiceClass;
  let numberHandler: (injection: Injection) => number | Number;
  let stringHandler: (injection: Injection) => string | String;
  let booleanHandler: (injection: Injection) => boolean | Boolean;

  class MyServiceClassInjectionHandler {

    @injectionHandler(MyServiceClass)
    public static createMyServiceClass(injection: Injection) {
      return serviceHandler(injection);
    }

    @injectionHandler(CompatibleClass)
    public createMyServiceClass(injection: Injection) {
      return {saySomething: () => 'baz4'};
    }

  }

  injector.addHandler(Number, {handleInjection: (injection: Injection) => numberHandler(injection)});
  injector.addHandler(String, {handleInjection: (injection: Injection) => stringHandler(injection)});
  injector.addHandler(Boolean, {handleInjection: (injection: Injection) => booleanHandler(injection)});

  beforeEach(() => {
    serviceHandler = spy(({param}) => new MyServiceClass(param));
    numberHandler = (injection) => 0;
    stringHandler = (injection) => '';
    booleanHandler = (injection) => false;
    instance = create(MyClientClass);
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
        'Could not apply decorator "inject" to "unknownType": Property type could not be inferred. '
      + 'Only classes and primitive types are supported.'
    );
  });

  it('injects property by type via @injectionHandler', () => {
    expect(instance.injectedClass).to.be.instanceOf(MyServiceClass);
  });

  it('injects compatible type via @injectionHandler', () => {
    expect(instance.compatibleClass.saySomething()).to.equal('baz4');
  });

  it('injects @injectable class', () => {
    expect(instance.autoInjectableClass).to.be.instanceOf(MyInjectableClass);
  });

  it('injected property available in constructor', () => {
    class ExtenedClientClass extends MyClientClass {
      public injectedClassCopy: MyServiceClass;
      constructor() {
        super();
        this.injectedClassCopy = this.injectedClass;
      }
    }

    let instance2 = create(ExtenedClientClass);

    expect(instance2.injectedClassCopy).to.be.instanceOf(MyServiceClass);
    expect(instance2.injectedClass).to.equal(instance2.injectedClassCopy);
  });

  it('caches value', () => {
    expect(instance.injectedClass).to.be.equal(instance.injectedClass);
    expect(instance.autoInjectableClass).to.be.equal(instance.autoInjectableClass);
  });

  it('caches value per instance', () => {
    expect(create(MyClientClass).injectedClass).not.to.equal(instance.injectedClass);
    expect(create(MyClientClass).autoInjectableClass).not.to.equal(instance.autoInjectableClass);
  });

  it('caches shared @injectable classes globally', () => {
    expect(create(MyClientClass).singleton).to.equal(instance.singleton);
    expect(create(MyClientClass).autoInjectableClass.singleton).to.equal(instance.singleton);
  });

  it('throws if handler does not exist (yet)', () => {
    class MyUnusedServiceClass { }
    class InjectingUnusedServiceClass { @inject public service: MyUnusedServiceClass; }

    // TODO: Should throw in `create` already
    expect(() => create(InjectingUnusedServiceClass).service).to.throw(
      'Can not inject value of type MyUnusedServiceClass since no compatible injection handler exists for this type.'
    );
  });

  it('supports falsy primitives', () => {
    expect(instance.aBoolean).to.be.false;
    expect(instance.aNumber).to.equal(0);
    expect(instance.aString).to.equal('');
  });

  it('unboxes primitives', () => {
    numberHandler = (injection) => new Number(23);
    stringHandler = (injection) => new String('foo');
    booleanHandler = (injection) => new Boolean('true');
    instance = create(MyClientClass);

    expect(instance.aNumber.valueOf()).to.equal(23);
    expect(instance.aString.valueOf()).to.equal('foo');
    expect(instance.aBoolean.valueOf()).to.equal(true);
    expect(instance.aNumber).not.to.be.instanceof(Number);
    expect(instance.aNumber).not.to.be.instanceof(String);
    expect(instance.aNumber).not.to.be.instanceof(Boolean);
  });

  it('default param is undefined', () => {
    expect(instance.injectedClass.param).to.be.undefined;
  });

  it('gives Injection infos to handler', () => {
    instance.injectedClass;
    instance.fooClass;

    let injection: Injection = (serviceHandler as SinonSpy).args[0][0];
    let fooInjection: Injection = (serviceHandler as SinonSpy).args[1][0];
    expect(injection.name).to.equal('injectedClass');
    expect(injection.index).to.be.undefined;
    expect(injection.instance).to.equal(instance);
    expect(injection.param).to.be.undefined;
    expect(injection.type).to.be.undefined;
    expect(fooInjection.name).to.equal('fooClass');
    expect(fooInjection.index).to.be.undefined;
    expect(fooInjection.instance).to.equal(instance);
    expect(fooInjection.param).to.equal('foo');
    expect(fooInjection.type).to.be.undefined;
  });

  it('injects by superclass', () => {
    expect(instance.subClass).to.be.instanceOf(BaseClass);
    expect(instance.subClass.saySomething()).to.equal('baz2');
  });

  describe('on constructor', () => {

    it('ignored on direct constructor call', () => {
      let instance2 = new ConstructorWithInjection('foo', new MyServiceClass('bar'), 23, new MyServiceClass('foo'));
      expect(instance2.number).to.equal(23);
      expect(instance2.str).to.equal('foo');
      expect(instance2.service.param).equal('bar');
      expect(instance2.otherService.param).equal('foo');
    });

    it('injects when used with create', () => {
      numberHandler = (injection) => 44;

      let instance2 = create(ConstructorWithInjection);

      expect(instance2.number).to.equal(44);
    });

    it('injects with injection parameter', () => {
      let instance2 = create(ConstructorWithInjection, ['foo']);
      expect(instance2.service.param).to.equal('foo2');
    });

    it('gives Injection infos to handler', () => {
      create(ConstructorWithInjection);

      let fooInjection: Injection = (serviceHandler as SinonSpy).args[0][0];
      let otherInjection: Injection = (serviceHandler as SinonSpy).args[1][0];
      expect(fooInjection.name).to.be.undefined;
      expect(fooInjection.index).to.equal(1);
      expect(fooInjection.instance).to.be.undefined;
      expect(fooInjection.param).to.equal('foo2');
      expect(fooInjection.type).to.equal(ConstructorWithInjection);
      expect(otherInjection.name).to.be.undefined;
      expect(otherInjection.index).to.equal(3);
      expect(otherInjection.instance).to.be.undefined;
      expect(otherInjection.param).to.be.undefined;
      expect(otherInjection.type).to.equal(ConstructorWithInjection);
    });

    it('does not inject when not decorated', () => {
      let instance2 = create(ConstructorWithInjection, ['foo3', undefined, 34]);
      expect(instance2.str).to.equal('foo3');
      expect(instance2.service).to.be.instanceOf(MyServiceClass);
      expect(instance2.number).to.equal(0);
    });

    it('create passes explicit construction parameter to super constructor', () => {
      class ExtendedConstrutorWithInjection extends ConstructorWithInjection {}
      let instance2 = create(ExtendedConstrutorWithInjection, ['foo3', undefined, 34]);
      expect(instance2.str).to.equal('foo3');
      expect(instance2.service).to.be.instanceOf(MyServiceClass);
      expect(instance2.number).to.equal(0);
    });

    it('injects implicit field', () => {
      let instance2 = create(ConstructorWithInjection);
      expect(instance2.otherService).to.be.instanceOf(MyServiceClass);
    });

    describe('via JSX', () => {

      class MyCustomWidget extends Composite {

        public service: MyServiceClass;
        public foo: string;
        public nonInjected: number;

        private jsxProperties: CompositeProperties;

        constructor(
          properties: CompositeProperties,
          @inject service: MyServiceClass,
          @inject('foo') foo: string,
          nothingToInject: number,
          @inject('bar') public implicitField: string
        ) {
          super(properties);
          this.foo = foo;
          this.service = service;
          this.nonInjected = nothingToInject;
        }

      }

      let widget: MyCustomWidget;

      beforeEach(() => {
        stringHandler = injection => new String(injection.param);
        widget = (
        <MyCustomWidget left={3} top={4}>
          <composite/>
        </MyCustomWidget>
        );
      });

      afterEach(() => {
        tabrisMock.reset();
      });

      it('injects parameterless', () => {
        expect(widget.service).to.be.instanceOf(MyServiceClass);
      });

      it('injects with injection parameter', () => {
        expect(widget.foo).to.equal('foo');
      });

      it('does not inject when not decorated', () => {
        expect(widget.nonInjected).to.be.undefined;
      });

      it('injects implicit field', () => {
        expect(widget.foo).to.equal('foo');
      });

      it('passes attributes', () => {
        expect(widget.left).to.equal(3);
        expect(widget.top).to.equal(4);
      });

      it('passes children', () => {
        expect(widget.children().length).to.equal(1);
      });

    });

  });

});
