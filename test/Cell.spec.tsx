import 'mocha';
import { match } from 'sinon';
import { Color, Composite, Properties, tabris, TextView, WidgetCollection } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { expect, restoreSandbox, spy } from './test';
import { injector } from '../src';
import { Cell, TextCell } from '../src/api/Cell';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('Cell', () => {

  class MyItem {
    public foo: string = 'bar';
  }

  beforeEach(() => {
    tabris._init(new ClientMock());
    JSX.install(injector.jsxProcessor);
  });

  afterEach(() => {
    restoreSandbox();
  });

  it('extends Composite', () => {
    expect(new Cell()).to.be.instanceOf(Cell);
    expect(new Cell()).to.be.instanceOf(Composite);
  });

  it('does not accept item on creation', () => {
    expect(() => new (Cell as any)({item: new MyItem()})).to.throw();
    expect(() => <Cell item={new MyItem() as never}/>).to.throw();
  });

  it('supports data binding', () => {
    const cell: Cell<MyItem> = (
      <Cell>
        <TextView bind-text='item.foo'/>
      </Cell>
    );

    cell.item = new MyItem();

    expect((cell as any)._find(TextView).only().text).to.equal('bar');
  });

  it('can be extended', () => {
    class MyCell extends Cell<MyItem> {
      constructor(properties: Properties<MyCell>) {
        super({highlightOnTouch: true});
      }
    }
    const cell: MyCell = (
      <MyCell>
        <TextView bind-text='item.foo'/>
      </MyCell>
    );

    cell.item = new MyItem();

    expect((cell as any)._find(TextView).only().text).to.equal('bar');
  });

  describe('item', () => {

    let cell: Cell<MyItem>;

    beforeEach(() => {
      cell = new Cell();
    });

    it('is null initially', () => {
      expect(cell.item).to.be.null;
    });

    it('accepts new item', () => {
      cell.item = new MyItem();
    });

    it('fires change event', () => {
      const item = new MyItem();
      const listener = spy();
      cell.onItemChanged(listener);

      cell.item = item;

      expect(listener).to.have.been.calledOnceWith(match.has('value', item));
    });

    it('accepts null', () => {
      cell.item = new MyItem();
      cell.item = null;

      expect(cell.item).to.be.null;
    });

  });

  describe('TextCell', () => {

    function itemToText(item: any): string {
      const cell = new TextCell();
      cell.item = item;
      const children: WidgetCollection = (cell as any)._children();
      return children.only(TextView).text;
    }

    it('contains TextView', () => {
      const cell = new TextCell();
      const children: WidgetCollection = (cell as any)._children();
      expect(children.only(TextView)).to.be.instanceOf(TextView);
    });

    it('stringifies items', () => {
      expect(itemToText('foo')).to.equal('foo');
      expect(itemToText(1)).to.equal('1');
      expect(itemToText(true)).to.equal('true');
      expect(itemToText(null)).to.equal('null');
      expect(itemToText(undefined)).to.equal('undefined');
      expect(itemToText({toString() { return 'foo'; }})).to.equal('foo');
      expect(itemToText([1, 2, 3])).to.equal('1,2,3');
    });

  });

});
