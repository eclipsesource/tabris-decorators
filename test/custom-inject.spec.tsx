import 'mocha';
import 'sinon';
import { Composite, CompositeProperties } from 'tabris';
import { create, inject, injectable, injectionHandler, JSX, resolve, shared } from './customInjector';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox } from './test';
import { Injection, injector as orgInjector } from '../src';
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

orgInjector.injectable(MyServiceClass);
orgInjector.injectable({shared: true})(MySingletonClass);

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

  it('does not share values with default injector', () => {
    let instance = create(ConstructorWithInjection);
    let singleton = resolve(MySingletonClass);

    expect(instance.singleton).to.equal(singleton);
    expect(singleton).to.not.equal(orgInjector.resolve(MySingletonClass));
  });

  it('fails when used with default create', () => {
    expect(() => {
      orgInjector.create(ConstructorWithInjection);
    }).to.throw('Could not create instance of ConstructorWithInjection:\n@inject belongs to a different injector');
  });

  describe('via JSX', () => {

    class MyCustomWidget extends Composite {

      constructor(
        properties: CompositeProperties,
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
      }).to.throw('Could not create instance of MyCustomWidget:\n@inject belongs to a different injector');
    });

    it('works with custom JSX object', () => {
      let widget: MyCustomWidget = <MyCustomWidget/>;
      expect(widget.service).to.be.instanceOf(MyServiceClass);
    });

  });

});
