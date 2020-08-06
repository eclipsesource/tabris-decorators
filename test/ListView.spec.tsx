import 'mocha';
import {match, SinonSpy, stub} from 'sinon';
import {CollectionView, Image, ImageView, tabris, TextView, ToggleButton, Widget, WidgetCollection} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy} from './test';
import {injector} from '../src';
import {Cell, TextCell} from '../src/api/Cell';
import {List} from '../src/api/List';
import {ItemAction, ListView, ListViewSelectEvent} from '../src/api/ListView';

describe('ListView', () => {

  class MyItem {
    foo: string = 'bar';
  }

  function items() {
    const arr: MyItem[]  = new Array(10);
    for (let i = 0; i < 10; i++) {
      arr[i] = new MyItem();
    }
    return arr;
  }

  let listView: ListView<MyItem | string | Image>;

  beforeEach(() => {
    tabris._init(new ClientMock());
    JSX.install(injector.jsxProcessor);
  });

  afterEach(() => {
    restoreSandbox();
  });

  it('extends CollectionView', () => {
    expect(new ListView()).to.be.instanceOf(ListView);
    expect(new ListView()).to.be.instanceOf(CollectionView);
  });

  it('supports factory API', () => {
    const arr = [1];
    expect(ListView({items: arr}).items).to.deep.equal(arr);
  });

  describe('items', () => {

    beforeEach(() => {
      listView = new ListView();
    });

    it('is null initially', () => {
      expect(listView.items).to.be.null;
    });

    it('accepts List', () => {
      const list = List.from(items());

      listView.items = list;

      expect(listView.items).to.equal(list);
    });

    it('accepts Array', () => {
      const arr = items();

      listView.items = arr;

      expect(listView.items).to.equal(arr);
    });

    it('fires change event', () => {
      const list = List.from(items());
      const listener = spy();
      listView.onItemsChanged(listener);

      listView.items = list;

      expect(listener).to.have.been.calledOnceWith(match.has('value', list));
    });

    it('does not fire change event when setting same list', () => {
      const list = List.from(items());
      const listener = spy();
      listView.items = list;
      listView.onItemsChanged(listener);

      listView.items = list;

      expect(listener).not.to.have.been.called;
    });

    it('accepts null', () => {
      listView.items = items();
      listView.items = null;

      expect(listView.items).to.be.null;
    });

    it('rejects other types', () => {
      expect(() => listView.items = 'foo' as any).to.throw();
      expect(() => listView.items = 23 as any).to.throw();
      expect(() => listView.items = {} as any).to.throw();
      expect(() => listView.items = undefined as any).to.throw();
    });

    it('reloads with new length', () => {
      spy(listView, 'load');

      listView.items = items();

      expect(listView.load).to.have.been.calledOnceWith(10);
      expect(listView.itemCount).to.equal(10);
    });

    it('reloads with 0 for null', () => {
      listView.items = new List<MyItem>(10);
      spy(listView, 'load');

      listView.items = null;

      expect(listView.load).to.have.been.calledOnceWith(0);
      expect(listView.itemCount).to.equal(0);
    });

    describe('mutation', () => {

      let list: List<MyItem>;

      beforeEach(() => {
        list = List.from(items());
        listView.items = list;
        spy(listView, 'refresh');
        spy(listView, 'remove');
        spy(listView, 'insert');
        spy(listView, 'load');
      });

      it('refreshes when item is set', () => {
        list[2] = new MyItem();
        expect(listView.refresh).to.have.been.calledOnceWith(2);
      });

      it('does not refresh when item on previous list is set', () => {
        listView.items = new List();
        list[2] = new MyItem();
        expect(listView.refresh).not.to.have.been.called;
      });

      it('refreshes when item is deleted', () => {
        delete list[2];
        expect(listView.refresh).to.have.been.calledOnceWith(2);
      });

      it('inserts when item is pushed', () => {
        list.push(new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(10, 1);
      });

      it('inserts when multiple items are pushed', () => {
        list.push(new MyItem(), new MyItem(), new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(10, 3);
      });

      it('inserts when item is unshifted', () => {
        list.unshift(new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(0, 1);
      });

      it('re-aligns item indicies when item is unshifted', () => {
        const cells: Array<Cell<any>> = [listView.createCell(''), listView.createCell(''), listView.createCell('')];
        cells.forEach((cell, index) => cell.itemIndex = index);
        stub(listView as any, '_children').returns(new WidgetCollection(cells));
        stub(listView, 'itemIndex')
          .withArgs(cells[0]).returns(1)
          .withArgs(cells[1]).returns(2)
          .withArgs(cells[2]).returns(-1);

        list.unshift(new MyItem());

        expect(cells[0].itemIndex).to.equal(1);
        expect(cells[1].itemIndex).to.equal(2);
        expect(cells[2].itemIndex).to.equal(2); // updates with next updateCell callback
      });

      it('inserts when multiple items are unshifted', () => {
        list.unshift(new MyItem(), new MyItem(), new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(0, 3);
      });

      it('removes when item is popped', () => {
        list.pop();
        expect(listView.remove).to.have.been.calledOnceWith(9, 1);
      });

      it('inserts when single item is spliced in', () => {
        list.splice(2, 0, new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(2, 1);
      });

      it('inserts when multiple item are spliced in', () => {
        list.splice(2, 0, new MyItem());
        expect(listView.insert).to.have.been.calledOnceWith(2, 1);
      });

      it('removes when single item is spliced out', () => {
        list.splice(2, 1);
        expect(listView.remove).to.have.been.calledOnceWith(2, 1);
      });

      it('removes when multiple items are spliced out', () => {
        list.splice(2, 3);
        expect(listView.remove).to.have.been.calledOnceWith(2, 3);
      });

      it('refreshes when equal amount of items are spliced in and out', () => {
        list.splice(3, 2, new MyItem(), new MyItem());
        expect(listView.refresh).to.have.been.calledWith(3);
        expect(listView.refresh).to.have.been.calledWith(4);
      });

      it('reloads when all items are spliced out', () => {
        list.splice(0, Infinity, new MyItem(), new MyItem());
        expect(listView.load).to.have.been.calledWith(2);
      });

      it('refreshes and inserts when more items are spliced in', () => {
        list.splice(1, 1, new MyItem(), new MyItem());
        expect(listView.refresh).to.have.been.calledWith(1);
        expect(listView.insert).to.have.been.calledWith(2);

      });

      it('refreshes and inserts when more items are spliced out', () => {
        list.splice(1, 4, new MyItem(), new MyItem());
        expect(listView.refresh).to.have.been.calledWith(1);
        expect(listView.refresh).to.have.been.calledWith(2);
        expect(listView.remove).to.have.been.calledWith(3, 2);
      });

      it('loads when first items are inserted', () => {
        list.splice(0);
        list.push(new MyItem(), new MyItem());
        expect(listView.load).to.have.been.calledWith(0);
        expect(listView.load).to.have.been.calledWith(2);
      });

      it('inserts when item is set', () => {
        list[19] = new MyItem();
        expect(listView.insert).to.have.been.calledOnceWith(10, 10);
      });

      it('inserts when length is set', () => {
        list.length = 20;
        expect(listView.insert).to.have.been.calledOnceWith(10, 10);
      });

      it('removes when length is set', () => {
        list.length = 5;
        expect(listView.remove).to.have.been.calledOnceWith(5, 5);
      });

    });

    describe('diffing', () => {

      let arr: MyItem[];
      let copy: MyItem[];

      beforeEach(() => {
        arr = items();
        // ensures duplicate entries do not cause issues:
        arr = arr.concat(arr.reverse());
        copy = arr.concat();
        listView.items = arr;
        spy(listView, 'refresh');
        spy(listView, 'remove');
        spy(listView, 'insert');
        spy(listView, 'load');
      });

      it('does nothing with exact copy', () => {
        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.insert).not.to.have.been.called;
        expect(listView.remove).not.to.have.been.called;
        expect(listView.load).not.to.have.been.called;
      });

      it('calls refresh on set', () => {
        copy[2] = new MyItem();

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledOnceWith(2);
      });

      it('calls refresh on multi-set', () => {
        copy[0] = new MyItem();
        copy[10] = new MyItem();
        copy[19] = new MyItem();

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledWith(0);
        expect(listView.refresh).to.have.been.calledWith(10);
        expect(listView.refresh).to.have.been.calledWith(19);
      });

      it('calls refresh on range-set', () => {
        copy.splice(10, 3, new MyItem(), new MyItem(), new MyItem());

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledWith(10);
        expect(listView.refresh).to.have.been.calledWith(11);
        expect(listView.refresh).to.have.been.calledWith(12);
      });

      it('calls refresh on shift', () => {
        copy.splice(2, 0, new MyItem());
        copy.splice(4, 1);

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledWith(2);
        expect(listView.refresh).to.have.been.calledWith(3);
      });

      it('calls refresh on duplication', () => {
        copy[3] = copy[4];

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledOnceWith(3);
      });

      it('calls refresh on flip', () => {
        const temp = copy[3];
        copy[3] = copy[4];
        copy[4] = temp;

        listView.items = copy;

        expect(listView.refresh).to.have.been.calledWith(3);
        expect(listView.refresh).to.have.been.calledWith(4);
      });

      it('calls insert on single insert', () => {
        copy.splice(10, 0, new MyItem());

        listView.items = copy;

        expect(listView.load).not.to.have.been.called;
        expect(listView.insert).to.have.been.calledOnceWith(10, 1);
      });

      it('calls insert on range insert', () => {
        copy.splice(10, 0, new MyItem(), new MyItem(), new MyItem());

        listView.items = copy;

        expect(listView.insert).to.have.been.calledOnceWith(10, 3);
      });

      it('calls insert on push', () => {
        copy.push(new MyItem());

        listView.items = copy;

        expect(listView.insert).to.have.been.calledOnceWith(20, 1);
      });

      it('calls insert on unshift', () => {
        copy.unshift(new MyItem());

        listView.items = copy;

        expect(listView.insert).to.have.been.calledOnceWith(0, 1);
      });

      it('calls insert on length set', () => {
        copy.length = 30;

        listView.items = copy;

        expect(listView.insert).to.have.been.calledOnceWith(20, 10);
      });

      it('calls remove on single remove', () => {
        copy.splice(10, 1);

        listView.items = copy;

        expect(listView.remove).to.have.been.calledOnceWith(10, 1);
      });

      it('calls remove on range remove', () => {
        copy.splice(10, 3);

        listView.items = copy;

        expect(listView.remove).to.have.been.calledOnceWith(10, 3);
      });

      it('calls remove on pop', () => {
        copy.pop();

        listView.items = copy;

        expect(listView.remove).to.have.been.calledOnceWith(19, 1);
      });

      it('calls remove on shift', () => {
        copy.shift();

        listView.items = copy;

        expect(listView.remove).to.have.been.calledOnceWith(0, 1);
      });

      it('calls remove on length set', () => {
        copy.length = 10;

        listView.items = copy;

        expect(listView.remove).to.have.been.calledOnceWith(10, 10);
      });

      it('calls load on set and insert', () => {
        copy[0] = new MyItem();
        copy.push(new MyItem());

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.insert).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(21);
      });

      it('calls load on set and remove', () => {
        copy[1] = new MyItem();
        copy.pop();

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.remove).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(19);
      });

      it('calls load on splice with more inserts than deletes', () => {
        copy.splice(2, 1, new MyItem(), new MyItem());

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.insert).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(21);
      });

      it('calls load on splice with more deletes than inserts', () => {
        copy.splice(2, 4, new MyItem(), new MyItem(), new MyItem());

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.remove).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(19);
      });

      it('calls load on multiple removes', () => {
        copy.splice(2, 2);
        copy.splice(12, 1);

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.remove).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(17);
      });

      it('calls load on multiple inserts', () => {
        copy.splice(2, 0, new MyItem());
        copy.splice(12, 0, new MyItem());

        listView.items = copy;

        expect(listView.refresh).not.to.have.been.called;
        expect(listView.insert).not.to.have.been.called;
        expect(listView.load).to.have.been.calledOnceWith(22);
      });

    });

  });

  describe('createCell', () => {

    function _children(widget: Widget): WidgetCollection {
      return (widget as any)._children();
    }

    function cellForItem(index: number) {
      return listView.createCell((listView.cellType as (index: number) => string)(index));
    }

    it('creates TextCell initially', () => {
      expect(new ListView().createCell('0')).to.be.instanceOf(TextCell);
    });

    it('is set by single JSX Cell', () => {
      listView = (
        <ListView>
          <Cell highlightOnTouch>
            <TextView bind-text='item.foo'/>
            <ImageView image='foo.png'/>
          </Cell>
        </ListView>
      );

      const cell = listView.createCell('0');
      cell.item = new MyItem();

      expect(cell).to.be.instanceOf(Cell);
      expect(cell).not.to.equal(listView.createCell('0'));
      expect(cell.highlightOnTouch).to.be.true;
      expect(_children(cell)[0]).to.be.instanceOf(TextView);
      expect(_children(cell).only(TextView).text).to.equal('bar');
      expect(Image.from(_children(cell).only(ImageView).image).src).to.equal('foo.png');
    });

    it('enables highlightOnTouch on selectable cells', () => {
      listView = (
        <ListView>
          <Cell selectable/>
        </ListView>
      );

      const cell = listView.createCell('0');
      cell.item = new MyItem();

      expect(cell.highlightOnTouch).to.be.true;
    });

    it('is set for multiple types by multiple JSX Cell elements', () => {
      listView = (
        <ListView>
          <Cell itemType={MyItem}>
            <TextView bind-text='item.foo'/>
            <ImageView image='foo.png'/>
          </Cell>
          <Cell itemType='string'>
            <TextView bind-text='item'/>
          </Cell>
          <Cell itemCheck={Image.isImageValue}>
            <ImageView bind-image='item'/>
          </Cell>
        </ListView>
      );

      listView.items = ['foo', new MyItem(), Image.from('foo')];

      expect(_children(cellForItem(0)).length).to.equal(1);
      expect(_children(cellForItem(1)).length).to.equal(2);
      expect(_children(cellForItem(2)).length).to.equal(1);
      expect(_children(cellForItem(0))[0]).to.be.instanceOf(TextView);
      expect(_children(cellForItem(1))[0]).to.be.instanceOf(TextView);
      expect(_children(cellForItem(1))[1]).to.be.instanceOf(ImageView);
      expect(_children(cellForItem(2))[0]).to.be.instanceOf(ImageView);
    });

    it('prioritizes cell types by Cell element order', () => {
      listView = (
        <ListView>
          <Cell itemType='string'>
            <TextView/>
          </Cell>
          <Cell itemType={Object}/>
          <Cell itemType={MyItem}>
            <ImageView/>
          </Cell>
        </ListView>
      );

      listView.items = ['foo', new MyItem(), Image.from('foo')];

      expect(_children(cellForItem(0)).length).to.equal(1);
      expect(_children(cellForItem(1)).length).to.equal(0);
      expect(_children(cellForItem(2)).length).to.equal(0);
      expect(_children(cellForItem(0))[0]).to.be.instanceOf(TextView);
    });

    it('combines itemType with itemCheck', () => {
      listView = (
        <ListView>
          <Cell itemType={Object} itemCheck={v => !(v instanceof Image)}/>
          <Cell itemType={Image} itemCheck={v => v.height !== 'auto' && v.height <= 50}>
            <ImageView height={50}/>
          </Cell>
          <Cell itemType={Image}>
            <ImageView height={100}/>
          </Cell>
        </ListView>
      );

      listView.items = [new MyItem(), Image.from({height: 50, src: 'foo'}), Image.from('foo')];

      expect(_children(cellForItem(0)).length).to.equal(0);
      expect(_children(cellForItem(1)).length).to.equal(1);
      expect(_children(cellForItem(2)).length).to.equal(1);
      expect(_children(cellForItem(1))[0].height).to.equal(50);
      expect(_children(cellForItem(2))[0].height).to.equal(100);
    });

    it('can not be set by non-Cell children', () => {
      expect(() => (
        <ListView>
          <TextView bind-text='item.foo'/>
        </ListView>
      )).to.throw();
    });

  });

  describe('cellHeight', () => {

    function heightForItem(index: number) {
      return (listView.cellHeight as (index: number) => number)(index);
    }

    it('is set by JSX Cell with height', () => {
      listView = (
        <ListView>
          <Cell height={23}/>
        </ListView>
      );

      listView.items = [null];

      expect(heightForItem(0)).to.equal(23);
    });

    it('is set for multiple item types by multiple JSX Cell elements', () => {
      listView = (
        <ListView>
          <Cell itemType={MyItem} height={23}/>
          <Cell itemType='string' height={24}/>
          <Cell itemType={Image}/>
        </ListView>
      );

      listView.items = ['foo', new MyItem(), Image.from('foo')];

      expect(heightForItem(0)).to.equal(24);
      expect(heightForItem(1)).to.equal(23);
      expect(heightForItem(2)).to.equal('auto');
    });

    it('falls back to initial value', () => {
      listView = (
        <ListView cellHeight={25}>
          <Cell itemType={MyItem} height={23}/>
          <Cell itemType='string' height={24}/>
          <Cell itemType={Image}/>
        </ListView>
      );

      listView.items = ['foo', new MyItem(), Image.from('foo')];

      expect(heightForItem(0)).to.equal(24);
      expect(heightForItem(1)).to.equal(23);
      expect(heightForItem(2)).to.equal(25);
    });

  });

  describe('updateCell', () => {

    beforeEach(() => {
      listView = new ListView();
      listView.items = items();
    });

    it('assigns items', () => {
      const cells = [listView.createCell(''), listView.createCell(''), listView.createCell('')];

      listView.updateCell(cells[0], 0);
      listView.updateCell(cells[1], 1);
      listView.updateCell(cells[2], 2);

      expect(cells[0].item).to.equal(listView.items[0]);
      expect(cells[1].item).to.equal(listView.items[1]);
      expect(cells[2].item).to.equal(listView.items[2]);
    });

    it('assigns itemIndicies', () => {
      const cells = [listView.createCell(''), listView.createCell(''), listView.createCell('')];

      expect(listView.updateCell(cells[0], 0));
      expect(listView.updateCell(cells[1], 1));
      expect(listView.updateCell(cells[2], 2));

      expect(cells[0].itemIndex).to.equal(0);
      expect(cells[1].itemIndex).to.equal(1);
      expect(cells[2].itemIndex).to.equal(2);
    });

  });

  describe('onSelect', () => {

    let listener: SinonSpy<[ListViewSelectEvent<MyItem>]>;
    let cell: Cell;

    beforeEach(() => {
      listView = new ListView();
      listView.items = items();
      cell = listView.createCell('');
      stub(cell, 'parent').returns(listView);
      listener = spy() as SinonSpy<[ListViewSelectEvent<MyItem>]>;
      listView.onSelect(listener);
      cell.item = listView.items[2];
      stub(listView, 'itemIndex').returns(2);
    });

    it('is triggered via ListView.select', () => {
      cell.onTap(ListView.select);

      cell.onTap.trigger({touches: [{x: 0, y: 0}]});

      expect(listener).to.have.been.calledOnce;
      const event = listener.getCalls()[0].args[0];
      expect(event).to.be.instanceOf(ListViewSelectEvent);
      expect(event.type).to.equal('select');
      expect(event.item).to.equal(listView.items[2]);
      expect(event.itemIndex).to.equal(2);
      expect(event.target).to.equal(listView);
      expect(event.originalEvent.type).to.equal('tap');
      expect(event.originalEvent.target).to.equal(cell);
      expect(event.action).to.equal(0);
    });

    it('is triggered via ListView.select with action', () => {
      cell.onTap(ev => ListView.select(ev, 23));

      cell.onTap.trigger({touches: [{x: 0, y: 0}]});

      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(23);
    });

    it('is triggered via ListView.selectPrimary', () => {
      cell.onTap(ListView.selectPrimary);

      cell.onTap.trigger({touches: [{x: 0, y: 0}]});

      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(ItemAction.Primary);
    });

    it('is triggered via tap if cell is selectable', () => {
      listView = <ListView><Cell selectable/></ListView>;
      listView.items = items();
      cell = listView.createCell('0');
      stub(cell, 'parent').returns(listView);
      listView.onSelect(listener);
      cell.item = listView.items[2];
      stub(listView, 'itemIndex').returns(2);

      cell.onTap.trigger({touches: [{x: 0, y: 0}]});

      expect(listener).to.have.been.calledOnce;
      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(0);
    });

    it('is triggered via ListView.selectSecondary', () => {
      cell.onLongPress(ListView.selectSecondary);

      cell.onLongPress.trigger({touches: [{x: 0, y: 0}], state: 'end'});

      expect(listener).to.have.been.calledOnce;
      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(ItemAction.Secondary);
      expect(event.originalEvent.type).to.equal(event.originalEvent.target.onLongPress.type);
      expect(event.originalEvent.target).to.equal(cell);
    });

    it('is triggered via ListView.selectToggle', () => {
      const toggleButton: ToggleButton = <ToggleButton onSelect={ListView.selectToggle}/>;
      stub(toggleButton, 'parent').returns(listView);
      cell.append(toggleButton);

      toggleButton.onSelect.trigger();

      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(ItemAction.Toggle);
      expect(event.originalEvent.type).to.equal('select');
      expect(event.originalEvent.target).to.equal(toggleButton);
    });

    it('is triggered via ListView.selectDismiss', () => {
      cell.onSwipeLeft(ListView.selectDismiss);

      cell.onSwipeLeft.trigger();

      const event = listener.getCalls()[0].args[0];
      expect(event.action).to.equal(ItemAction.Dismiss);
    });

  });

});
