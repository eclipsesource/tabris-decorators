import 'mocha';
import { match } from 'sinon';
import { ChangeListeners, CollectionView, Composite, PropertyChangedEvent, tabris, TextInput, TextView, WidgetCollection } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { expect, restoreSandbox, spy } from './test';
import { component, event, injector, property, to } from '../src';
import { TextCell } from '../src/api/Cell';
import { List, ListLike } from '../src/api/List';
import { ListView } from '../src/api/ListView';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('ListView', () => {

  class MyItem {
    public foo: string = 'bar';
  }

  function items() {
    const arr: MyItem[]  = new Array(10);
    for (let i = 0; i < 10; i++) {
      arr[i] = new MyItem();
    }
    return arr;
  }

  let listView: ListView<MyItem>;

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

    it('creates TextCell initially', () => {
      expect(new ListView().createCell('')).to.be.instanceOf(TextCell);
    });

  });

  describe('updateCell', () => {

    beforeEach(() => {
      listView = new ListView();
      listView.items = items();
    });

    it('assigns items', () => {
      const cells = [listView.createCell(''), listView.createCell(''), listView.createCell('')];

      expect(listView.updateCell(cells[0], 0));
      expect(listView.updateCell(cells[1], 1));
      expect(listView.updateCell(cells[2], 2));

      expect(cells[0].item).to.equal(listView.items[0]);
      expect(cells[1].item).to.equal(listView.items[1]);
      expect(cells[2].item).to.equal(listView.items[2]);
    });

  });

});
