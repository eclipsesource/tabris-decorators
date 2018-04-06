import 'mocha';
import 'sinon';
import { SinonSpy } from 'sinon';
import { Composite, CompositeProperties } from 'tabris';
import { WidgetCollection } from 'tabris';
import { TextInput } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox, spy } from './test';
import { Constructor, create, inject, injectable, Injection, injectionHandler, injector, shared } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/

describe('inject', () => {

  class MyServiceClass {
    constructor(readonly param: string | undefined) { }
  }

  @injectable({shared: true}) class MySingletonClass {
    public saySomething() { return 'baz1'; }
  }

  @shared class MyOtherSingletonClass {}

  class BaseClass {
    public saySomething() { return 'baz1'; }
  }

  @injectable({implements: BaseClass})
  class CompatibleClass {
    public saySomething() { return 'baz3'; }
  }

  abstract class ColorClass {
    public abstract readonly color: string;
  }

  @injectable({param: 'blue'})
  class BlueClass extends ColorClass{
    public readonly color: string = '#0000ff';
  }

  @injectable({param: 'green'})
  class GreenClass extends ColorClass {
    public readonly color: string = '#00ff00';
  }

  class ConstructorWithInjection {

    public service: MyServiceClass;
    public number: number;
    public str: string;

    constructor(
      str: string | undefined,
      @inject('foo2') service: MyServiceClass,
      @inject num: number,
      @inject public otherService: MyServiceClass,
      @inject public singleton1?: MySingletonClass,
      @inject public singleton2?: MyOtherSingletonClass,
      @inject public baseClass?: BaseClass
    ) {
      this.str = str || '';
      this.number = num || 0;
      this.service = service;
    }

  }
  class MyServiceClassInjectionHandler {

    @injectionHandler(MyServiceClass)
    public static createMyServiceClass(injection: Injection) {
      return serviceHandler(injection);
    }

  }

  let serviceHandler: (injection: Injection) => MyServiceClass;
  let numberHandler: (injection: Injection) => number | Number;
  let stringHandler: (injection: Injection) => string | String;
  let booleanHandler: (injection: Injection) => boolean | Boolean;
  let instance: ConstructorWithInjection;

  injector.addHandler(Number, (injection: Injection) => numberHandler(injection));
  injector.addHandler(String, (injection: Injection) => stringHandler(injection));
  injector.addHandler(Boolean, (injection: Injection) => booleanHandler(injection));

  beforeEach(() => {
    serviceHandler = spy(({param}) => new MyServiceClass(param));
    numberHandler = (injection) => 0;
    stringHandler = (injection) => '';
    booleanHandler = (injection) => false;
    instance = create(ConstructorWithInjection);
  });

  afterEach(() => {
    restoreSandbox();
  });

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

  it('fails for unsupported type', () => {
    // tslint:disable-next-line:no-empty-interface
    interface UndefinedService { }
    const UndefinedService: Constructor<UndefinedService> = undefined as any;
    expect(() => {
      class HasMissingType {
        constructor(
          @inject service: UndefinedService
        ) { /* should not go here */ }
      }
    }).to.throw(
        'Could not apply decorator "inject" to parameter 0 of HasMissingType constructor: '
      + 'Parameter type could not be inferred. Only classes and primitive types are supported.'
    );
  });

  it('fails for undefined type', () => {
    // tslint:disable-next-line:no-empty-interface
    class UndefinedService {}
    (UndefinedService as any) = null;
    expect(() => {
      class HasMissingType {
        constructor(
          @inject service: UndefinedService
        ) { /* should not go here */ }
      }
    }).to.throw(
        'Could not apply decorator "inject" to parameter 0 of HasMissingType constructor: '
      + 'Parameter type is undefined: Do you have circular dependency issues?'
    );
  });

  it('injects with injection parameter', () => {
    let instance2 = create(ConstructorWithInjection, 'foo');
    expect(instance2.service.param).to.equal('foo2');
  });

  it('gives Injection infos to handler', () => {
    let fooInjection: Injection = (serviceHandler as SinonSpy).args[0][0];
    let otherInjection: Injection = (serviceHandler as SinonSpy).args[1][0];
    expect(fooInjection.param).to.equal('foo2');
    expect(fooInjection.type).to.equal(MyServiceClass);
    expect(otherInjection.param).to.be.null;
    expect(otherInjection.type).to.equal(MyServiceClass);
  });

  it('does not inject when not decorated', () => {
    let instance2 = create(ConstructorWithInjection, undefined, undefined, 34);
    expect(instance2.str).to.equal('');
    expect(instance2.service).to.be.instanceOf(MyServiceClass);
    expect(instance2.number).to.equal(34);
  });

  it('create passes explicit construction parameter to super constructor', () => {
    class ExtendedConstrutorWithInjection extends ConstructorWithInjection {}
    let instance2 = create(ExtendedConstrutorWithInjection, 'foo3', undefined, 34);
    expect(instance2.str).to.equal('foo3');
    expect(instance2.service).to.be.instanceOf(MyServiceClass);
    expect(instance2.number).to.equal(34);
  });

  it('injects implicit field', () => {
    expect(instance.otherService).to.be.instanceOf(MyServiceClass);
  });

  it('does not share non-singletons', () => {
    let instance2 = create(ConstructorWithInjection);
    expect(instance2.otherService).not.to.equal(instance.otherService);
  });

  it('shares singletons', () => {
    let instance2 = create(ConstructorWithInjection);
    expect(instance2.singleton1).to.equal(instance.singleton1);
    expect(instance2.singleton2).to.equal(instance.singleton2);
  });

  it('injects with compatible type', () => {
    expect(instance.baseClass).to.be.instanceOf(CompatibleClass);
  });

  it('injects by param filter', () => {
    class Colors {
      constructor(
        @inject('blue') public readonly b: ColorClass,
        @inject('green') public readonly g: ColorClass
      ) {}
    }
    let colors = create(Colors);
    expect(colors.g).to.be.instanceOf(GreenClass);
    expect(colors.b).to.be.instanceOf(BlueClass);
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

    it('does not interfere with stateless functional component', () => {
      function ComponentFoo(prop: {bar: string}, children: string[] ) {
        return new WidgetCollection([new TextInput({text: prop.bar}), new TextInput({text: children[0]})]);
      }
      let ti = <ComponentFoo bar='foo'>hello</ComponentFoo>;
      expect(ti[0].text).to.equal('foo');
      expect(ti[1].text).to.equal('hello');
    });

  });

});
