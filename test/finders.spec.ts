import 'mocha';
import 'sinon';
import {Composite, Button, ui} from 'tabris';
import {findFirst} from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect} from './test';

class CustomComponent extends Composite {

  @findFirst('.foo')
  public readonly firstFoo: Composite;

  constructor() {
    super();
    this.append(
      new Composite({class: 'foo', id: 'foo1'}),
      new Composite({class: 'foo', id: 'foo2'}),
      new Composite({class: 'foo', id: 'foo3'})
    );
  }

}

/* tslint:disable:no-unused-expression */
describe('finders', () => {

  let widget = new CustomComponent();

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  describe('findFirst', () => {

    it('returns first found Widget', () => {
      expect(widget.firstFoo.id).to.equal('foo1');
    });

    it('filters by type', () => {
      new Button({class: 'foo'}).insertBefore(widget.firstFoo);

      expect(widget.firstFoo.id).to.equal('foo1');
    });

  });

});
