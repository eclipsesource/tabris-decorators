import 'mocha';
import 'sinon';
import {Composite, Button, ui, WidgetCollection, Widget} from 'tabris';
import {getById, getByType} from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect} from './test';

/* tslint:disable:no-unused-expression max-classes-per-file */
describe('getters', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  describe('getById', () => {

    class CustomComponent extends Composite {

      @getById
      public readonly button1: Button;

      @getById
      public readonly composite1: Composite;

    }

    let widget: CustomComponent;
    let button1: Button;
    let composite1: Composite;

    beforeEach(() => {
      widget = new CustomComponent();
      button1 = new Button({id: 'button1'});
      composite1 = new Composite({id: 'composite1'});
    });

    it('returns widget by type and id', () => {
      widget.append(composite1, button1);

      expect(widget.button1).to.equal(button1);
      expect(widget.composite1).to.equal(composite1);
    });

    it('caches after append', () => {
      widget.append(composite1, button1);
      let button1_2 = new Button({id: 'button1'});
      button1.dispose();
      widget.append(button1_2);

      expect(widget.button1).to.equal(button1);
      expect(widget.button1).not.to.equal(button1_2);
    });

    it('fails to decorate unknown type', () => {
      expect(() => {
        class FailedComponent extends Composite {
          @getById public readonly button1: Button | null;
        }
      }).to.throw('Could not apply decorator "getById" to property "button1": Type could not be inferred.');
    });

    it('throws if a getter is accessed before first append', () => {
      expect(() => widget.button1).to.throw(
        'Decorator "getById" could not resolve property "button1": No widgets have been appended yet.'
      );
    });

    it('throws if a getter can not be resolved after first append', () => {
      expect(() => widget.append(composite1, new Button({id: 'button2'}))).to.throw(
        'Decorator "getById" could not resolve property "button1": No widget with id "button1" appended.'
      );
    });

    it('throws if getters finds wrong type after first append', () => {
      expect(() => widget.append(composite1, new Composite({id: 'button1'}))).to.throw(
        'Decorator "getById" could not resolve property "button1": Type mismatch.'
      );
    });

    it('throws if getters finds multiple matches', () => {
      expect(() => widget.append(composite1, button1, new Button({id: 'button1'}))).to.throw(
        'Decorator "getById" could not resolve property "button1": More than one widget with id "button1" appended.'
      );
    });

  });

  describe('getByType', () => {

    class CustomComponent extends Composite {

      @getByType
      public readonly foo: Button;

      @getByType
      public readonly bar: Composite;

    }

    let widget: CustomComponent;
    let button1: Button;
    let composite1: Composite;

    beforeEach(() => {
      widget = new CustomComponent();
      button1 = new Button({id: 'button1'});
      composite1 = new Composite({id: 'composite1'});
    });

    it('returns widget by type', () => {
      widget.append(composite1, button1);

      expect(widget.foo).to.equal(button1);
      expect(widget.bar).to.equal(composite1);
    });

    it('throws if a getter is accessed before first append', () => {
      expect(() => widget.foo).to.throw(
        'Decorator "getByType" could not resolve property "foo": No widgets have been appended yet.'
      );
    });

    it('throws if a getter can not be resolved after first append', () => {
      expect(() => widget.append(composite1)).to.throw(
        'Decorator "getByType" could not resolve property "foo": No widget of expected type appended.'
      );
    });

    it('throws if getters finds multiple matches', () => {
      expect(() => widget.append(composite1, button1, new Composite())).to.throw(
        'Decorator "getByType" could not resolve property "bar": More than one widget of expected type appended.'
      );
    });

  });

});
