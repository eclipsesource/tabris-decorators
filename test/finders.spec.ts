import 'mocha';
import 'sinon';
import {Composite, Button, ui} from 'tabris';
import {findFirst} from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect} from './test';

class CustomComponent extends Composite {

  @findFirst('.foo')
  public readonly firstFoo: Composite;

  @findFirst(Button, '.foo')
  public readonly maybeFoo: Button | null;

  @findFirst('.bar')
  public readonly firstBar: Composite;

  @findFirst('.bar')
  public settable: Composite;

  constructor() {
    super();
    this.append(
      new Composite({class: 'foo', id: 'foo1'}),
      new Composite({class: 'foo', id: 'foo2'}),
      new Composite({class: 'foo', id: 'foo3'})
    );
  }

}

/* tslint:disable:no-unused-expression max-classes-per-file */
describe('finders', () => {

  let widget: CustomComponent;

  beforeEach(() => {
    widget = new CustomComponent();
  });

  afterEach(() => {
    tabrisMock.reset();
    restoreSandbox();
  });

  describe('findFirst', () => {

    it('returns first found Widget', () => {
      expect(widget.firstFoo.id).to.equal('foo1');
    });

    it('modifies only the extending class', () => {
      expect('firstFoo' in CustomComponent.prototype).to.be.true;
      expect('firstFoo' in Composite.prototype).to.be.false;
    });

    it('does not cache', () => {
      new Composite({class: 'foo', id: 'newFirstFoo'}).insertBefore(widget.firstFoo);

      expect(widget.firstFoo.id).to.equal('newFirstFoo');
    });

    it('filters by type', () => {
      new Button({class: 'foo'}).insertBefore(widget.firstFoo);

      expect(widget.firstFoo.id).to.equal('foo1');
    });

    it('returns null if nothing matches', () => {
      expect(widget.maybeFoo).to.be.null;
    });

    it('throw if property is set', () => {
      expect(() => widget.settable = new Composite()).to.throw;
    });

    it('fails if return type can not be determined', () => {
      expect(() => {
        class FailingComponent extends Composite {
           @findFirst('.foo')
            public readonly unknownType: Button | null;
          }
      }).to.throw(
          'Could not apply decorator "findFirst" to property "unknownType": '
        + 'Return type was not given and could not be inferred.');
    });

    it('fails if a getter has already been defined', () => {
      expect(() => {
        class FailingComponent extends Composite {
          @findFirst('.foo')
          public get aGetter(): Composite { return new Composite(); }
        }
      }).to.throw(
          'Could not apply decorator "findFirst" to property "aGetter": '
        + 'A getter or setter was already defined.');
    });

  });

});
