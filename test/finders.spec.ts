/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file */
import 'mocha';
import 'sinon';
import {Composite, Button, WidgetCollection, Widget} from 'tabris';
import {findFirst, findLast, findAll} from '../src';
import * as tabrisMock from './tabris-mock';
import {restoreSandbox, expect} from './test';

class CustomComponent extends Composite {

  @findFirst('.foo')
  public readonly firstFoo: Composite;

  @findLast('.foo')
  public readonly lastFoo: Composite;

  @findAll(Composite, '.foo')
  public readonly allFoo: WidgetCollection<Composite>;

  @findFirst(Button, '.foo')
  public readonly maybeFoo: Button | null;

  @findFirst(Button)
  public readonly firstButton: Widget;

  @findAll(Button)
  public readonly allButtons: WidgetCollection<Button>;

  @findFirst
  public readonly firstButtonImplicit: Button;

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
      let originalFirstFoo = widget.firstFoo.id;
      new Composite({class: 'foo', id: 'newFirstFoo'}).insertBefore(widget.firstFoo);

      expect(originalFirstFoo).to.equal('foo1');
      expect(widget.firstFoo.id).to.equal('newFirstFoo');
    });

    it('includes grandchildren', () => {
      new Composite({class: 'bar', id: 'bar1'}).appendTo(widget.firstFoo);

      expect(widget.firstBar.id).to.equal('bar1');
    });

    it('filters by type', () => {
      new Button({class: 'foo'}).insertBefore(widget.firstFoo);

      expect(widget.firstFoo.id).to.equal('foo1');
    });

    it('filters by type only', () => {
      new Button({id: 'button1'}).insertBefore(widget.firstFoo);
      new Button({id: 'button2'}).insertAfter(widget.firstFoo);

      expect(widget.firstButton.id).to.equal('button1');
    });

    it('filters by implicit type only', () => {
      new Button({id: 'button1'}).insertBefore(widget.firstFoo);
      new Button({id: 'button2'}).insertAfter(widget.firstFoo);

      expect(widget.firstButtonImplicit.id).to.equal('button1');
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

  describe('findLast', () => {

    it('returns last found Widget', () => {
      expect(widget.lastFoo.id).to.equal('foo3');
    });

    it('filters by explicity type only', () => {
      new Button({id: 'button1'}).insertBefore(widget.firstFoo);
      new Button({id: 'button2'}).insertAfter(widget.firstFoo);

      expect(widget.firstButton.id).to.equal('button1');
    });

    it('fails if return type can not be determined', () => {
      expect(() => {
        class FailingComponent extends Composite {
            @findLast('.foo')
            public readonly unknownType: Button | null;
          }
      }).to.throw(
          'Could not apply decorator "findLast" to property "unknownType": '
        + 'Return type was not given and could not be inferred.');
    });

  });

  describe('findAll', () => {

    it('returns all matches', () => {
      expect(widget.allFoo.length).to.equal(3);
    });

    it('does not return non-matching types', () => {
      widget.append(new Button({class: '.foo'}));

      expect(widget.allFoo.length).to.equal(3);
    });

    it('does not return non-matching selectors', () => {
      widget.append(new Composite({class: '.bar'}));

      expect(widget.allFoo.length).to.equal(3);
    });

    it('returns all matches by type only', () => {
      new Button({id: 'button1'}).insertBefore(widget.firstFoo);
      new Button({id: 'button2'}).insertAfter(widget.firstFoo);

      expect(widget.allButtons.length).to.equal(2);
      expect(widget.allButtons[0]).to.be.instanceof(Button);
      expect(widget.allButtons[1]).to.be.instanceof(Button);
    });

    it('does not cache', () => {
      let originalCount = widget.allFoo.length;
      widget.append(new Composite({class: 'foo'}));

      expect(originalCount).to.equal(3);
      expect(widget.allFoo.length).to.equal(4);
    });

    it('fails if return type is not WidgetCollection', () => {
      expect(() => {
        class FailingComponent extends Composite {
           @findAll(Composite, '.foo')
            public readonly wrongType: Composite;
          }
      }).to.throw(
          'Could not apply decorator "findAll" to property "wrongType": '
        + 'Return type has to be WidgetCollection<WidgetType>.');
    });

  });

});
