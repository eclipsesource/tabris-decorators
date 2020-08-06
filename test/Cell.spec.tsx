import 'mocha';
import {match} from 'sinon';
import {Composite, ImageView, Set, Stack, tabris, TextView, Widget, WidgetCollection} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy} from './test';
import {injector, property} from '../src';
import {Cell, TextCell} from '../src/api/Cell';

describe('Cell', () => {

  class MyItem {
    foo: string = 'bar';
  }

  class MyCell extends Cell<MyItem> {
    constructor() {
      super({highlightOnTouch: true});
    }
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

  it('supports factory API', () => {
    expect(Cell()).to.be.instanceOf(Cell);
    expect(Cell()).to.be.instanceOf(Composite);
    expect(Cell({height: 23}).height).to.be.equal(23);
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

  it('supports apply', () => {
    const cell =
      Cell({children: [TextView()]})
        .apply({mode: 'strict', trigger: 'onItemChanged'}, ({item}) => ({
          TextView: Set(TextView, {
            text: item instanceof MyItem ? item.foo : ''
          })
        }));

    cell.item = new MyItem();

    expect((cell as any)._find(TextView).only().text).to.equal('bar');
  });

  it('can be extended', () => {
    const cell: MyCell = (
      <MyCell>
        <TextView bind-text='item.foo'/>
      </MyCell>
    );

    cell.item = new MyItem();

    expect((cell as any)._find(TextView).only().text).to.equal('bar');
  });

  describe('factory', () => {

    it ('throws for falsy argument', () => {
      expect(() => Cell.factory(null)).to.throw();
    });

    it ('throws for non "Cell" instance argument', () => {
      class NotCell extends Composite {
        @property item: MyItem;
      }
      expect(() => Cell.factory(<NotCell/>)).to.throw();
    });

    it ('throws for cells not created via JSX', () => {
      expect(() => Cell.factory(new Cell())).to.throw();
    });

    describe('from Cell element', () => {

      it ('returns same factory every time', () => {
        const cell: Cell<MyItem> = <Cell/>;
        expect(Cell.factory(cell)).to.equal(Cell.factory(cell));
        expect(Cell.factory(Cell.factory(cell)())).to.equal(Cell.factory(cell));
      });

      it ('returns source element first', () => {
        const cell: Cell<MyItem> = <Cell/>;
        expect(Cell.factory(cell)()).to.equal(cell);
      });

      it ('returns new elements after first', () => {
        const cell: Cell<MyItem> = <Cell/>;
        const first = Cell.factory(cell)();

        const second = Cell.factory(cell)();
        const third = Cell.factory(cell)();

        expect(second).to.be.instanceOf(Cell);
        expect(third).to.be.instanceOf(Cell);
        expect(first).not.to.equal(second);
        expect(second).not.to.equal(third);
      });

      it ('returns elements of same class', () => {
        const factory = Cell.factory(<MyCell/>);
        factory();

        expect(factory()).to.be.instanceOf(MyCell);
      });

      it ('returns elements with same attribute values', () => {
        const factory = Cell.factory(<Cell enabled={false} height={23}/>);
        factory();

        const element = factory();

        expect(element.enabled).to.be.false;
        expect(element.height).to.equal(23);
      });

      it ('returns elements with attributes from creation only', () => {
        const cell = <Cell enabled={false} height={23}/>;
        cell.enabled = true;
        const factory = Cell.factory(<Cell enabled={false} height={23}/>);
        cell.height = 13;
        factory();

        const element = factory();

        expect(element.enabled).to.be.false;
        expect(element.height).to.equal(23);
      });

      it ('returns elements with same listeners', () => {
        const listener = spy();
        const factory = Cell.factory(<Cell onEnabledChanged={listener}/>);
        const original = factory();

        const copy = factory();
        original.enabled = false;
        copy.enabled = false;

        expect(listener).to.be.have.been.calledTwice;
        expect(listener.firstCall.args[0].target).to.equal(original);
        expect(listener.secondCall.args[0].target).to.equal(copy);
      });

      it ('returns elements with listeners from creation only', () => {
        const listener = spy();
        const factory = Cell.factory(<Cell onEnabledChanged={listener}/>);
        const original = factory();
        original.onHighlightOnTouchChanged(listener);
        original.onEnabledChanged.removeListener(listener);

        const copy = factory();
        copy.enabled = false;
        copy.highlightOnTouch = true;

        expect(listener).to.be.have.been.calledOnce;
        expect(listener.firstCall.args[0].target).to.equal(copy);
        expect(listener.firstCall.args[0].value).to.be.false;
      });

      describe('with children', () => {

        function _children(widget: Widget): WidgetCollection {
          return (widget as any)._children();
        }

        function clone(cell: Cell): Cell {
          const factory = Cell.factory(cell);
          factory();
          return factory();
        }

        it('clones only child', () => {
          const cell: Cell = (
            <Cell>
              <TextView text='foo'/>
            </Cell>
          );

          const children = _children(clone(cell));

          expect(children.length).to.equal(1);
          expect(children[0]).to.be.instanceOf(TextView);
          expect((children[0] as TextView).text).to.equal('foo');
          expect(children[0]).not.to.equal(_children(cell)[0]);
        });

        it('clones children from creation only', () => {
          const cell: Cell = (
            <Cell>
              <TextView text='foo'/>
            </Cell>
          );
          _children(cell).dispose();
          cell.append(<ImageView/>);

          const children = _children(clone(cell));

          expect(children.length).to.equal(1);
          expect(children[0]).to.be.instanceOf(TextView);
        });

        it('clones children from JSX syntax only', () => {
          const cell: Cell = (
            <Cell>
              {new TextView({text: 'foo'})}
            </Cell>
          );

          expect(() => _children(clone(cell))).to.throw();
        });

        it('clones children deeply', () => {
          const cell: Cell = (
            <Cell>
              <Stack>
                <TextView text='foo'/>
                <TextView text='bar'/>
              </Stack>
            </Cell>
          );

          const children = _children(clone(cell));

          expect(children.length).to.equal(1);
          expect(children[0]).to.be.instanceOf(Stack);
          expect(_children(children[0]).length).to.equal(2);
          expect((_children(children[0])[0] as TextView).text).to.equal('foo');
          expect((_children(children[0])[1] as TextView).text).to.equal('bar');
        });

        it('clones with text content', () => {
          const cell: Cell = (
            <Cell>
              <Stack>
                <TextView>foo</TextView>
                <TextView>bar</TextView>
              </Stack>
            </Cell>
          );

          const children = _children(clone(cell));

          expect(children.length).to.equal(1);
          expect(children[0]).to.be.instanceOf(Stack);
          expect(_children(children[0]).length).to.equal(2);
          expect((_children(children[0])[0] as TextView).text).to.equal('foo');
          expect((_children(children[0])[1] as TextView).text).to.equal('bar');
        });

        it('clones with data binding', () => {
          const cell: Cell = (
            <Cell>
              <TextView bind-text='item.foo'/>
            </Cell>
          );
          const copy = clone(cell);

          copy.item = new MyItem();

          expect((_children(copy)[0] as TextView).text).to.equal('bar');
          expect((_children(cell)[0] as TextView).text).to.equal('');
        });

        it('clones custom Cell with constructor created content', () => {
          class MyCustomCell extends Cell<MyItem> {
            constructor() {
              super();
              this.append(<TextView bind-text='item.foo'/>);
            }
          }
          const cell: Cell = <MyCustomCell/>;

          const copy = clone(cell);
          copy.item = new MyItem();

          expect(_children(cell).length).to.equal(1);
          expect(_children(copy).length).to.equal(1);
          expect((_children(copy)[0] as TextView).text).to.equal('bar');
          expect((_children(cell)[0] as TextView).text).to.equal('');
        });

        it('clones with functional components using non-JSX syntax internally', () => {
          function MyStack(args: {highlightOnTouch: boolean, children: Widget[]}): Stack {
            return new Stack({
              enabled: false,
              highlightOnTouch: args.highlightOnTouch
            }).append(args.children);
          }
          const cell: Cell = (
            <Cell>
              <MyStack highlightOnTouch>
                <TextView>foo</TextView>
              </MyStack>
            </Cell>
          );

          const children = _children(clone(cell));

          expect(children.length).to.equal(1);
          expect(children[0]).to.be.instanceOf(Stack);
          expect(children[0].enabled).to.be.false;
          expect(children[0].highlightOnTouch).to.be.true;
          expect(_children(children[0]).length).to.equal(1);
          expect(_children(children[0])[0]).not.to.equal(_children(_children(cell)[0])[0]);
          expect((_children(children[0])[0] as TextView).text).to.equal('foo');
        });

      });

    });

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

  describe('itemIndex', () => {

    let cell: Cell<MyItem>;

    beforeEach(() => {
      cell = new Cell();
    });

    it('is -1 initially', () => {
      expect(cell.itemIndex).to.equal(-1);
    });

    it('accepts new index', () => {
      cell.itemIndex = 2;
      expect(cell.itemIndex).to.equal(2);
    });

    it('fires change event', () => {
      const listener = spy();
      cell.onItemIndexChanged(listener);

      cell.itemIndex = 2;

      expect(listener).to.have.been.calledOnceWith(match.has('value', 2));
    });

    it('rejects -2', () => {
      expect(() => cell.itemIndex = -2).to.throw();
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
