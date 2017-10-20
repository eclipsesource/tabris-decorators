/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/
import 'mocha';
import 'sinon';
import {Composite, CompositeProperties} from 'tabris';
import {restoreSandbox, expect} from './test';
import {injectionManager, inject, injectable} from '../src';
import * as tabrisMock from './tabris-mock';

const create = injectionManager.create;

class MyServiceClass {
  constructor(readonly param: string | undefined) { }
}

@injectable(true) class MySingletonClass {}

@injectable class MyInjectableClass {

  @inject public singleton: MySingletonClass;

}

class MyClientClass {
  @inject public readonly injectedClass: MyServiceClass;
  @inject public readonly autoInjectableClass: MyInjectableClass;
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
  let serviceHandler: (param: any) => MyServiceClass;
  let numberHandler: (param: any) => number | Number;
  let stringHandler: (param: any) => string | String;
  let booleanHandler: (param: any) => boolean | Boolean;

  injectionManager.addHandler(MyServiceClass, (param) => serviceHandler(param));
  injectionManager.addHandler(Number, (param) => numberHandler(param));
  injectionManager.addHandler(String, (param) => stringHandler(param));
  injectionManager.addHandler(Boolean, (param) => booleanHandler(param));

  beforeEach(() => {
    serviceHandler = (param) => new MyServiceClass(param);
    numberHandler = (param: any) => 0;
    stringHandler = (param: any) => '';
    booleanHandler = (param: any) => false;
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

  it('inject by type', () => {
    expect(instance.injectedClass).to.be.instanceOf(MyServiceClass);
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
      'Can not inject value of type MyUnusedServiceClass since no injection handler exists for this type.'
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
    instance = create(MyClientClass);

    expect(instance.aNumber.valueOf()).to.equal(23);
    expect(instance.aString.valueOf()).to.equal('foo');
    expect(instance.aBoolean.valueOf()).to.equal(true);
    expect(instance.aNumber).not.to.be.instanceof(Number);
    expect(instance.aNumber).not.to.be.instanceof(String);
    expect(instance.aNumber).not.to.be.instanceof(Boolean);
  });

  it('direct use', () => {
    class MyExternalClass {
      public readonly service: MyServiceClass;
      public readonly num: Number;
      constructor(props: {service: MyServiceClass, num: Number}) {
        Object.assign(this, props);
      }
    }

    let special = new MyExternalClass({
      service: inject(MyServiceClass, 'foo'),
      num: inject(Number)
    });

    expect(special.service.param).to.equal('foo');
    expect(special.num).to.equal(0);
  });

  it('default param is undefined', () => {
    expect(instance.injectedClass.param).to.be.undefined;
  });

  it('passes param', () => {
    expect(instance.fooClass.param).to.be.equal('foo');
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
      numberHandler = (param: any) => 44;

      let instance2 = create(ConstructorWithInjection);

      expect(instance2.number).to.equal(44);
    });

    it('injects with injection parameter', () => {
      let instance2 = create(ConstructorWithInjection, ['foo']);
      expect(instance2.service.param).to.equal('foo2');
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
        stringHandler = (param: any) => new String(param);
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
