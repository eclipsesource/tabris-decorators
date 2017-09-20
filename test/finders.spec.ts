import 'mocha';
import 'sinon';
import {Composite} from 'tabris';
import {findFirst} from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect} from './test';

class CustomComponent extends Composite {

  @findFirst('.foo')
  public firstFoo: Composite;

  constructor() {
    super();
    this.append(
      new Composite({class: 'foo', id: 'foo1'}),
      new Composite({class: 'foo', id: 'foo2'}),
      new Composite({class: 'foo', id: 'foo3'})
    );
  }

}

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

  });

});
