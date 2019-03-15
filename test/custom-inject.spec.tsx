import 'mocha';
import 'sinon';
import { Composite, Properties } from 'tabris';
import { create, inject, injectable, injectionHandler, injector, JSX, resolve, shared } from './customInjector';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox } from './test';
import { Injection, injector as orgInjector, Injector } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/

@injectable class MyServiceClass { }

@shared class MySingletonClass {}

class MyServiceClassInjectionHandler {

  @injectionHandler(MyServiceClassInjectionHandler)
  public static createMyServiceClass(injection: Injection) {
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
    let instance = create(ConstructorWithInjection);

    expect(instance).to.be.instanceOf(ConstructorWithInjection);
    expect(instance.service).to.be.instanceOf(MyServiceClass);
    expect(instance.singleton).to.be.instanceOf(MySingletonClass);
  });

  it('fails when used with default create', () => {
    expect(() => {
      orgInjector.create(ConstructorWithInjection);
    }).to.throw(
        'Could not create instance of ConstructorWithInjection:\n'
      + 'Could not inject value of type MyServiceClass since no compatible injection handler exists for this type.'
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

    afterEach(() => {
      tabrisMock.reset();
    });

    it('fails with default JSX object', () => {
      // tslint:disable-next-line:no-shadowed-variable
      let JSX = orgInjector.JSX;
      expect(() => {
        <MyCustomWidget/>;
      }).to.throw(
         'Could not create instance of MyCustomWidget:\n'
       + 'Could not inject value of type MyServiceClass since no compatible injection handler exists for this type.'
      );
    });

    it('works with custom JSX object', () => {
      let widget: MyCustomWidget = <MyCustomWidget/>;
      expect(widget.service).to.be.instanceOf(MyServiceClass);
    });

  });

});
