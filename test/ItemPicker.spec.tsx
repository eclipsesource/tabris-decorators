import 'mocha';
import { match, SinonSpy, stub } from 'sinon';
import { EventObject, Image, ImageView, Picker, tabris, TextView, ToggleButton, Widget, WidgetCollection } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { expect, restoreSandbox, spy } from './test';
import { injector, property } from '../src';
import { ItemPicker, ItemPickerSelectEvent } from '../src/api/ItemPicker';
import { List } from '../src/api/List';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('ItemPicker', () => {

  type Item = {test: number};

  function strings() {
    const arr: string[] = new Array(10);
    for (let i = 0; i < 10; i++) {
      arr[i] = 'Item ' + i;
    }
    return arr;
  }

  let picker: ItemPicker<string>;
  let itemPicker: ItemPicker<Item>;

  beforeEach(() => {
    tabris._init(new ClientMock());
    JSX.install(injector.jsxProcessor);
    picker = new ItemPicker({
      items: List.from(['foo', 'bar', 'baz'])
    });
    itemPicker = new ItemPicker<{test: number}>({
      items: [{test: 23}]
    });
  });

  afterEach(() => {
    restoreSandbox();
  });

  it('extends Picker', () => {
    expect(picker).to.be.instanceOf(ItemPicker);
    expect(picker).to.be.instanceOf(Picker);
  });

  it('accepts properties', () => {
    expect(new ItemPicker({id: 'foo'}).id).to.equal('foo');
  });

  describe('items', () => {

    it('is null initially', () => {
      expect(new ItemPicker().items).to.be.null;
    });

    it('accepts List', () => {
      const list = List.from(strings());

      picker.items = list;

      expect(picker.items).to.equal(list);
    });

    it('accepts Array', () => {
      const arr = strings();

      picker.items = arr;

      expect(picker.items).to.equal(arr);
    });

    it('sets selectionIndex -1 to 0', () => {
      picker.selectionIndex = -1;

      picker.items = strings();

      expect(picker.selectionIndex).to.equal(0);
      expect(picker.selection).to.equal('Item 0');
    });

    it('accepts null', () => {
      picker.items = strings();
      picker.selectionIndex = 1;

      picker.items = null;

      expect(picker.selectionIndex).to.equal(-1);
      expect(picker.selection).to.be.null;
    });

    it('accepts comma separated string via JSX as List', () => {
      picker = (
        <ItemPicker>
          foo, bar,
          baz, hello world
        </ItemPicker>
      );

      expect(picker.items).to.be.instanceOf(List);
      expect(Array.from(picker.items)).to.deep.equal(['foo', 'bar', 'baz', 'hello world']);
    });

    it('accepts array via JSX', () => {
      picker = (
        <ItemPicker>{['foo', 'bar']}</ItemPicker>
      );

      expect(picker.items).to.deep.equal(['foo', 'bar']);
    });

    it('accepts List via JSX', () => {
      const list = List.from(['foo', 'bar']);
      picker = (
        <ItemPicker>{list}</ItemPicker>
      );

      expect(picker.items).to.equal(list);
    });

    it('fires change event', () => {
      const list = List.from(strings());
      const listener = spy();
      picker.onItemsChanged(listener);

      picker.items = list;

      expect(listener).to.have.been.calledOnceWith(match.has('value', list));
    });

    it('does not fire change event when setting same list', () => {
      const list = List.from(strings());
      const listener = spy();
      picker.items = list;
      picker.onItemsChanged(listener);

      picker.items = list;

      expect(listener).not.to.have.been.called;
    });

    it('accepts null', () => {
      picker.items = strings();
      picker.items = null;

      expect(picker.items).to.be.null;
    });

    it('rejects other types', () => {
      expect(() => picker.items = 'foo' as any).to.throw();
      expect(() => picker.items = 23 as any).to.throw();
      expect(() => picker.items = {} as any).to.throw();
      expect(() => picker.items = undefined as any).to.throw();
    });

  });

  describe('itemCount', () => {

    it('is set to items array length', () => {
      picker.items = strings();

      expect(picker.itemCount).to.equal(10);
    });

    it('is set to changing items list length', () => {
      picker.items = List.from(strings());

      picker.items.pop();

      expect(picker.itemCount).to.equal(9);
    });

    it('is 0 when items is null', () => {
      picker.items = strings();

      picker.items = null;

      expect(picker.itemCount).to.equal(0);
    });

  });

  describe('itemText', () => {

    it('returns string item from array', () => {
      picker.items = ['foo', 'bar', 'baz'];

      expect(picker.itemText(0)).to.equal('foo');
      expect(picker.itemText(1)).to.equal('bar');
      expect(picker.itemText(2)).to.equal('baz');
    });

    it('returns stringified item from array', () => {
      const anyPicker = new ItemPicker<any>();
      anyPicker.items = [1, true, null, undefined, {toString() { return 'foo'; }}, [1, 2, 3]];

      expect(anyPicker.itemText(0)).to.equal('1');
      expect(anyPicker.itemText(1)).to.equal('true');
      expect(anyPicker.itemText(2)).to.equal('null');
      expect(anyPicker.itemText(3)).to.equal('undefined');
      expect(anyPicker.itemText(4)).to.equal('foo');
      expect(anyPicker.itemText(5)).to.equal('1,2,3');
    });

    it('is replaced when items array is replaced', () => {
      picker.items = ['foo', 'bar', 'baz'];
      const itemText = picker.itemText;

      picker.items = ['bar', 'baz'];

      expect(picker.itemText).not.to.equal(itemText);
    });

    it('returns shifted list item', () => {
      picker.items.shift();

      expect(picker.itemText(0)).to.equal('bar');
      expect(picker.itemText(1)).to.equal('baz');
      expect(picker.itemText(2)).to.equal(undefined);
    });

    it('returns replaced list item', () => {
      picker.items[1] = 'new';

      expect(picker.itemText(0)).to.equal('foo');
      expect(picker.itemText(1)).to.equal('new');
      expect(picker.itemText(2)).to.equal('baz');
    });

    it('is replaced when items list is modified', () => {
      const itemText = picker.itemText;

      picker.items[1] = 'new';

      expect(picker.itemText).not.to.equal(itemText);
    });

  });

  describe('textSource', () => {

    class ItemClass {
      @property public test: number;
    }

    it('is null initially', () => {
      expect(picker.textSource).to.be.null;
    });

    it('can be set to valid path', () => {
      itemPicker.textSource = 'test';

      expect(itemPicker.itemText(0)).to.equal('23');
    });

    it('warns on invalid path', () => {
      spy(console, 'warn');

      itemPicker.textSource = 'foo';

      // tslint:disable-next-line: no-console
      expect(console.warn).to.have.been.calledOnce;
      expect(itemPicker.itemText(0)).to.equal('undefined');
    });

    it('fires change event', () => {
      const listener = spy();
      itemPicker.onTextSourceChanged(listener);

      itemPicker.textSource = 'test';

      expect(listener).to.have.been.calledOnce;
      const event = listener.getCalls()[0].args[0];
      expect(event.value).to.equal('test');
    });

    it('updates itemText when textSource changes', () => {
      const itemText = itemPicker.itemText;
      itemPicker.textSource = 'test';

      expect(itemPicker.itemText(0)).to.equal('23');
      expect(itemPicker.itemText).not.to.equal(itemText);
    });

    it('updates itemText when item is replaced in List', () => {
      itemPicker.items = List.from(itemPicker.items);
      itemPicker.textSource = 'test';
      const itemText = itemPicker.itemText;

      itemPicker.items[0] = {test: 24};

      expect(itemPicker.itemText(0)).to.equal('24');
      expect(itemPicker.itemText).not.to.equal(itemText);
    });

    it('updates itemText when item mutates', () => {
      const myItem = new ItemClass();
      myItem.test = 24;
      itemPicker.items[1] = myItem;
      itemPicker.textSource = 'test';
      const itemText = itemPicker.itemText;

      itemPicker.items[1].test = 25;

      expect(itemPicker.itemText(1)).to.equal('25');
      expect(itemPicker.itemText).not.to.equal(itemText);
    });

    it('forces selectionIndex update when item mutates', () => {
      const myItem = new ItemClass();
      myItem.test = 24;
      itemPicker.items[1] = myItem;
      itemPicker.selectionIndex = 1;
      itemPicker.textSource = 'test';
      const listener = spy();
      itemPicker.onSelectionIndexChanged(listener);

      itemPicker.items[1].test = 25;

      expect(listener).to.have.been.calledTwice;
      expect(itemPicker.selectionIndex).to.equal(1);
    });

    it('does note update selection when item mutates', () => {
      const myItem = new ItemClass();
      myItem.test = 24;
      itemPicker.items[1] = myItem;
      itemPicker.selectionIndex = 1;
      itemPicker.textSource = 'test';
      const listener = spy();
      itemPicker.onSelectionChanged(listener);

      itemPicker.items[1].test = 25;

      expect(listener).not.to.have.been.called;
      expect(itemPicker.selection).to.equal(myItem);
    });

    it('do not update itemText when former item mutates', () => {
      const myItem = new ItemClass();
      myItem.test = 24;
      itemPicker.textSource = 'test';
      itemPicker.items = [myItem];
      itemPicker.items = [{test: 26}];
      const itemText = itemPicker.itemText;

      myItem.test = 25;

      expect(itemPicker.itemText(0)).to.equal('26');
      expect(itemPicker.itemText).to.equal(itemText);
    });

    it('supports converter', () => {
      itemPicker.textSource = {path: 'test', converter: value => value + 'px'};

      expect(itemPicker.itemText(0)).to.equal('23px');
    });

  });

  describe('selection', () => {

    it('returns item from itemIndex', () => {
      picker.selectionIndex = 1;
      expect(picker.selection).to.equal('bar');
    });

    it('sets selectionIndex', () => {
      picker.selection = 'bar';
      expect(picker.selectionIndex).to.equal(1);
    });

    it('sets selectionIndex to -1 if item not found', () => {
      picker.selection = 'not an item';
      expect(picker.selectionIndex).to.equal(-1);
    });

    it('can be set via JSX', () => {
      picker = <ItemPicker selection='bar'>{picker.items}</ItemPicker>;
      expect(picker.selection).to.equal('bar');
      expect(picker.selectionIndex).to.equal(1);
    });

  });

  describe('itemSelect event', () => {

    it('is triggered by select event', () => {
      const listener = spy();
      picker.onItemSelect(listener);

      picker.selection = 'bar';
      picker.onSelect.trigger({index: 1});

      expect(listener).to.have.been.called.calledOnce;
      expect(listener.getCalls()[0].args[0].itemIndex).to.to.equal(1);
      expect(listener.getCalls()[0].args[0].item).to.to.equal('bar');
      expect(listener.getCalls()[0].args[0].itemText).to.to.equal('bar');
    });
  });

  describe('selectionChanged event', () => {

    it('is triggered by selectionIndexChange', () => {
      const listener = spy();
      picker.onSelectionChanged(listener);

      picker.selectionIndex = 1;

      expect(listener).to.have.been.called.calledOnce;
      expect(listener.getCalls()[0].args[0].value).to.to.equal('bar');
    });

    it('is triggered by item replacement', () => {
      picker.selectionIndex = 1;
      const listener = spy();
      picker.onSelectionChanged(listener);

      picker.items[1] = 'baz';

      expect(listener).to.have.been.called.calledOnce;
      expect(listener.getCalls()[0].args[0].value).to.to.equal('baz');
    });

    it('is triggered by item removal', () => {
      picker.selectionIndex = 1;
      const listener = spy();
      picker.onSelectionChanged(listener);

      picker.items.splice(1, 1);

      expect(listener).to.have.been.called.calledOnce;
      expect(listener.getCalls()[0].args[0].value).to.to.equal(null);
    });

    it('is not triggered by list pop', () => {
      picker.selectionIndex = 1;
      const listener = spy();
      picker.onSelectionChanged(listener);

      picker.items.pop();

      expect(listener).not.to.have.been.called.calledOnce;
    });

    it('is triggered by list shift', () => {
      picker.selectionIndex = 1;
      const listener = spy();
      picker.onSelectionChanged(listener);

      picker.items.shift();

      expect(listener).to.have.been.called.calledOnce;
      expect(listener.getCalls()[0].args[0].value).to.equal(null);
    });

  });

});
