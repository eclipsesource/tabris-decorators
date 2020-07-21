import 'mocha';
import 'sinon';
import {Composite, Properties, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {create, inject, injectable, injectionHandler, injector, JSX, resolve, shared} from './customInjector';
import {expect, restoreSandbox} from './test';
import {component, Injection, injector as orgInjector, Injector} from '../src';
import {ExtendedJSX} from '../src/internals/ExtendedJSX';

@injectable class MyServiceClass { }

@shared class MySingletonClass {}

class MyServiceClassInjectionHandler {

  @injectionHandler(MyServiceClassInjectionHandler)
  static createMyServiceClass(injection: Injection) {
    return new MyServiceClassInjectionHandler();
  }

}

class ConstructorWithInjection {

  constructor(
    @inject public service: MyServiceClass,
    @inject public singleton: MySingletonClass
  ) { }

}

describe('custom injector inject', () => {

  afterEach(() => {
    restoreSandbox();
  });

  it('injects when used with matching create', () => {
    const instance = create(ConstructorWithInjection);

    expect(instance).to.be.instanceOf(ConstructorWithInjection);
    expect(instance.service).to.be.instanceOf(MyServiceClass);
    expect(instance.singleton).to.be.instanceOf(MySingletonClass);
  });

  it('fails when used with default create', () => {
    expect(() => {
      orgInjector.create(ConstructorWithInjection);
    }).to.throw(
      'Could not create instance of ConstructorWithInjection:\nError: Could not '
      + 'inject value of type MyServiceClass since no compatible injection handler exists for this type.'
    );
  });

  it('resolves when used with matching resolve', () => {
    expect(resolve(MyServiceClass)).to.be.instanceOf(MyServiceClass);
    expect(resolve(MySingletonClass)).to.be.instanceOf(MySingletonClass);
  });

  it('fails when used with default resolve', () => {
    expect(() => {
      orgInjector.resolve(MyServiceClass);
    }).to.throw(
      'Could not inject value of type MyServiceClass since no compatible injection handler exists for this type.'
    );
  });

  it('can be obtained by Injector.get', () => {
    const instance = create(ConstructorWithInjection);
    const singleton = resolve(MyServiceClass);

    expect(Injector.get(instance)).to.equal(injector);
    expect(Injector.get(instance).inject).to.equal(inject);
    expect(Injector.get(singleton)).to.equal(injector);
    expect(Injector.get(singleton).inject).to.equal(inject);
  });

  describe('via JSX', () => {

    class MyCustomWidget extends Composite {

      constructor(
        properties: Properties<Composite>,
        @inject public service: MyServiceClass
      ) {
        super(properties);
      }

    }

    beforeEach(() => {
      tabris._init(new ClientMock());
      // tabris._init installs a non-extended processor that ignores injection completely
      // For this test we want one that throws for missing injections
      (global as any).JSX.install(new ExtendedJSX(orgInjector));
    });

    it('fails with default JSX object', () => {
      // eslint-disable-next-line no-shadow
      const JSX = orgInjector.jsxProcessor;
      expect(() => {
        <MyCustomWidget/>;
      }).to.throw(
        'Could not create instance of MyCustomWidget:\nError: '
       + 'Could not inject value of type MyServiceClass since no compatible injection handler exists for this type.'
      );
    });

    it('works with custom JSX object', () => {
      const widget: MyCustomWidget = <MyCustomWidget/>;
      expect(widget.service).to.be.instanceOf(MyServiceClass);
    });

    it('works with custom component injector override', () => {
      // eslint-disable-next-line no-shadow
      const JSX = orgInjector.jsxProcessor;
      @component({injector})
      class MyCustomComponent extends Composite {

        constructor(
          properties: Properties<Composite>,
          @inject public service: MyServiceClass
        ) {
          super(properties);
        }

      }
      const widget: MyCustomComponent = <MyCustomComponent/>;
      expect(widget.service).to.be.instanceOf(MyServiceClass);
    });

    it('works with jsx-via-factory', () => {
      class MyCustomComponent extends Composite {

        constructor(
          properties: Properties<Composite>,
          @inject public service: MyServiceClass
        ) {
          super(properties);
        }

      }
      const Factory = component({factory: true, injector})(MyCustomComponent);
      const widget: MyCustomComponent = Factory();
      expect(widget.service).to.be.instanceOf(MyServiceClass);
    });

  });

});
