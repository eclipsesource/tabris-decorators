import 'mocha';
import 'sinon';
import { Button, Composite } from 'tabris';
import * as tabrisMock from './tabris-mock';
import { expect, restoreSandbox } from './test';
import { component, getById, typeGuards } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */

describe('getById', () => {

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  @component class CustomComponent extends Composite {

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
      @component class FailedComponent extends Composite {
        @getById public readonly button1: Button | null;
      }
    }).to.throw(
        'Could not apply decorator "getById" to "button1": '
      + 'Property type could not be inferred.'
    );
  });

  it('fails to resolve on none-@component', () => {
    expect(() => {
      class FailedComponent extends Composite {
        @getById public readonly button1: Button;
      }
      new FailedComponent().append(new Button({id: 'button1'}));
    }).to.throw(
      'Decorator "getById" could not resolve property "button1": FailedComponent is not a @component'
    );
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
        'Decorator "getById" could not resolve property "button1": '
      + 'Expected value to be of type "Button", but found "Composite'
    );
  });

  it('accepts incompatible types when typeGuard allows it', () => {
    let notReallyAButton = new Composite({id: 'button1'});
    typeGuards.add(Button, (value): value is Button => value.id === 'button1');

    widget.append(composite1, notReallyAButton);

    expect(widget.button1).to.equal(notReallyAButton);
  });

  it('throws if getters finds multiple matches', () => {
    expect(() => widget.append(composite1, button1, new Button({id: 'button1'}))).to.throw(
      'Decorator "getById" could not resolve property "button1": More than one widget with id "button1" appended.'
    );
  });

});
