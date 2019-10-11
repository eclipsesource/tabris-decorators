import 'mocha';
import 'sinon';
import { expect, spy } from './test';
import { List, ListLike, ListLikeConstructor, listObservers, Mutation } from '../src/api/List';
/* tslint:disable:no-unused-expression max-classes-per-file max-file-line-count no-empty*/

describe('List', () => {

  const data = Object.freeze(
    [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11]
  );

  describe('Array Compatibility:', () => {

    [Array, List].forEach((Arr: ListLikeConstructor) => {

      let list: ListLike<number>;

      describe(Arr.name + ' statics', () => {

        describe('from', () => {

          it('string', () => {
            const strArr = Arr.from('foo');
            expect(strArr).to.be.instanceOf(Arr);
            expect(strArr.length).to.equal(3);
            expect(Array.from(strArr)).to.deep.equal(['f', 'o', 'o']);
          });

          it('actual array', () => {
            list = Arr.from([1, 2, 3]);
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([1, 2, 3]);
          });

          it('array-like', () => {
            list = Arr.from({0: 2, 1: 1, 2: 0, length: 3});
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([2, 1, 0]);
          });

          it('iterable', () => {
            list = Arr.from([1, 2, 3].values());
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([1, 2, 3]);
          });

          it('array with mapper', () => {
            list = Arr.from([1, 2, 3], (v, i) => v + i);
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([1, 3, 5]);
          });

          it('array with mapper and context', () => {
            list = Arr.from(
              [1, 2, 3],
              function(v: number) { return v + this.foo; },
              {foo: 2}
            );
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([3, 4, 5]);
          });

        });

        describe('of', () => {

          it('creates array from single argument', () => {
            list = Arr.of(2);
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(1);
            expect(Array.from(list)).to.deep.equal([2]);
          });

          it('creates array from varargs', () => {
            list = Arr.of(1, 2, 3);
            expect(list).to.be.instanceOf(Arr);
            expect(list.length).to.equal(3);
            expect(Array.from(list)).to.deep.equal([1, 2, 3]);
          });

        });

      });

      describe(Arr.name + ' constructor', () => {

        it('creates empty instance', () => {
          list = new Arr();
          expect(list).to.be.instanceOf(Arr);
          expect(list.length).to.equal(0);
        });

        it('creates array of given length', () => {
          list = new Arr(23);
          expect(list).to.be.instanceOf(Arr);
          expect(list.length).to.equal(23);
        });

        it('throws if length is invalid number', () => {
          expect(() => new Arr(-1)).to.throw();
          expect(() => new Arr(NaN)).to.throw();
          expect(() => new Arr(Infinity)).to.throw();
        });

        it('creates array from varargs', () => {
          list = new Arr(1, 2, 3);
          expect(list).to.be.instanceOf(Arr);
          expect(list.length).to.equal(3);
          expect(Array.from(list)).to.deep.equal([1, 2, 3]);
        });

        it('creates array from single non-number item', () => {
          const nonNum = new Arr('foo');
          expect(nonNum).to.be.instanceOf(Arr);
          expect(nonNum.length).to.equal(1);
          expect(Array.from(nonNum)).to.deep.equal(['foo']);
        });

      });

      describe(Arr.name + ' instance', () => {

        beforeEach(() => {
          list = Arr.from(data);
        });

        describe('length', () => {

          it('get', () => {
            expect(list.length).to.deep.equal(20);
          });

          it('set shorter', () => {
            list.length = 5;

            expect(list.length).to.equal(5);
            expect(Array.from(list)).to.deep.equal([10, 11, 12, 13, 14]);
            expect(4 in list).to.be.true;
            expect(4).to.equal(4);
            expect(5 in list).to.be.false;
            expect(list[5]).to.be.undefined;
          });

          it('set longer', () => {
            const empty = [];
            empty.length = 10;
            list.length = 30;

            expect(list.length).to.equal(30);
            expect(list[0]).to.equal(10);
            expect(list[1]).to.equal(11);
            expect(list[19]).to.equal(11);
            expect(20 in list).to.be.false;
            expect(list[29]).to.be.undefined;
            expect(29 in list).to.be.false;
          });

          it('set to string', () => {
            list.length = '5' as any;

            expect(list.length).to.equal(5);
            expect(Array.from(list)).to.deep.equal([10, 11, 12, 13, 14]);
            expect(4 in list).to.be.true;
            expect(list[4]).to.equal(14);
            expect(5 in list).to.be.false;
            expect(list[5]).to.be.undefined;
          });

          it('set to float throws', () => {
            expect(() => list.length = 5.4).to.throw();
          });

          it('set to negative number throws', () => {
            expect(() => list.length = -5).to.throw();
            expect(list.length).to.equal(20);
          });

          it('set to NaN throws', () => {
            expect(() => list.length = NaN).to.throw();
            expect(list.length).to.equal(20);
          });

          it('set to Infinity throws', () => {
            expect(() => list.length = Infinity).to.throw();
            expect(list.length).to.equal(20);
          });

        });

        describe('read/write', () => {

          it('changes value by number address', () => {
            list[0] = 100;
            expect(list[0]).to.equal(100);
          });

          it('changes value by string address', () => {
            list['0'] = 100;
            expect(list[0]).to.equal(100);
          });

          it('changes length', () => {
            list.length = 3;
            list[5] = 3;
            expect(Array.from(list)).to.deep.equal([10, 11, 12, undefined, undefined, 3]);
          });

          it('deletes entry', () => {
            delete list[2];
            expect(list[2]).to.be.undefined;
            expect(2 in list).to.be.false;
          });

          it('setting by float index fails', () => {
            list[0.3] = 100;
            expect(list[0]).to.equal(10);
            expect(list['0.3']).to.equal(100);
          });

          it('is iterable', () => {
            let last: number = null;
            let count = 0;

            for (const entry of list) {
              count++;
              last = entry;
            }

            expect(count).to.equal(20);
            expect(last).to.deep.equal(11);
          });

        });

        describe('entries()', () => {

          it('is iterator', () => {
            const results: Array<IteratorResult<[number, number]>> = [];
            const entries = list.entries();

            while (!results.length || !results[results.length - 1].done) {
              results.push(entries.next());
            }

            expect(results.length).to.equal(21);
            expect(results[0]).to.deep.equal({done: false, value: [0, 10]});
            expect(results[1]).to.deep.equal({done: false, value: [1, 11]});
            expect(results[19]).to.deep.equal({done: false, value: [19, 11]});
            expect(results[20]).to.deep.equal({done: true, value: undefined});
          });

          it('is iterable', () => {
            let last: [number, number] = null;
            let count = 0;

            for (const entry of list.entries()) {
              count++;
              last = entry;
            }

            expect(count).to.equal(20);
            expect(last).to.deep.equal([19, 11]);
          });

        });

        describe('find()', () => {

          it('returns first element to match', () => {
            expect(list.find(v => v > 12)).to.equal(13);
          });

          it('returns undefined if nothing matched', () => {
            expect(list.find(v => v > 20)).to.be.undefined;
          });

          it('calls callback with index and list', () => {
            const cb = spy(() => false);
            list.find(cb);

            expect(cb).to.have.been.calledWith(10, 0, list);
            expect(cb).to.have.been.calledWith(11, 1, list);
            expect(cb).to.have.been.calledWith(12, 18, list);
            expect(cb).to.have.been.calledWith(11, 19, list);
          });

          it('calls callback without context', () => {
            const cb = spy(() => true);

            list.find(cb);

            expect(cb).to.have.been.calledOn(undefined);
          });

          it('calls callback on given context', () => {
            const that = {};
            const cb = spy(() => true);

            list.find(cb, that);

            expect(cb).to.have.been.calledOn(that);
          });

        });

        describe('findIndex()', () => {

          it('returns index of first element to match', () => {
            expect(list.findIndex(v => v > 12)).to.equal(3);
          });

          it('returns -1 if nothing matched', () => {
            expect(list.findIndex(v => v > 20)).to.equal(-1);
          });

          it('calls callback with index and list', () => {
            const cb = spy(() => false);
            list.findIndex(cb);

            expect(cb).to.have.been.calledWith(10, 0, list);
            expect(cb).to.have.been.calledWith(11, 1, list);
            expect(cb).to.have.been.calledWith(12, 18, list);
            expect(cb).to.have.been.calledWith(11, 19, list);
          });

          it('calls callback without context', () => {
            const cb = spy(() => true);

            list.findIndex(cb);

            expect(cb).to.have.been.calledOn(undefined);
          });

          it('calls callback on given context', () => {
            const that = {};
            const cb = spy(() => true);

            list.findIndex(cb, that);

            expect(cb).to.have.been.calledOn(that);
          });

        });

        describe('forEach()', () => {

          it('returns undefined', () => {
            expect(list.forEach(spy())).to.be.undefined;
          });

          it('calls callback with index and list', () => {
            const cb = spy();
            list.forEach(cb);

            expect(cb).to.have.callCount(20);
            expect(cb).to.have.been.calledWith(10, 0, list);
            expect(cb).to.have.been.calledWith(11, 1, list);
            expect(cb).to.have.been.calledWith(12, 18, list);
            expect(cb).to.have.been.calledWith(11, 19, list);
          });

          it('calls callback without context', () => {
            const cb = spy();

            list.forEach(cb);

            expect(cb).to.have.been.calledOn(undefined);
          });

          it('calls callback on given context', () => {
            const that = {};
            const cb = spy();

            list.forEach(cb, that);

            expect(cb).to.have.been.calledOn(that);
          });

        });

        describe('indexOf()', () => {

          it('returns index for included element', () => {
            expect(list.indexOf(11)).to.equal(1);
            expect(list.indexOf(11, 10)).to.equal(19);
          });

          it('returns -1 for missing element', () => {
            expect(list.indexOf(1)).to.equal(-1);
            expect(list.indexOf(10, 1)).to.equal(-1);
          });

        });

        describe('join()', () => {

          it('joins array with comma', () => {
            expect(list.join()).to.equal(data.join());
          });

          it('joins array with given separator', () => {
            expect(list.join('-')).to.equal(data.join('-'));
          });

        });

        describe('keys()', () => {

          it('is iterator', () => {
            const results: Array<IteratorResult<number>> = [];
            const keys = list.keys();

            while (!results.length || !results[results.length - 1].done) {
              results.push(keys.next());
            }

            expect(results.length).to.equal(21);
            expect(results[0]).to.deep.equal({done: false, value: 0});
            expect(results[1]).to.deep.equal({done: false, value: 1});
            expect(results[19]).to.deep.equal({done: false, value: 19});
            expect(results[20]).to.deep.equal({done: true, value: undefined});
          });

          it('is iterable', () => {
            let last: number = null;
            let count = 0;

            for (const entry of list.keys()) {
              count++;
              last = entry;
            }

            expect(count).to.equal(20);
            expect(last).to.deep.equal(19);
          });

        });

        describe('lastIndexOf()', () => {

          it('returns last index for included element', () => {
            expect(list.lastIndexOf(10)).to.equal(0);
            expect(list.lastIndexOf(11)).to.equal(19);
            expect(list.lastIndexOf(11, 10)).to.equal(1);
          });

          it('returns -1 for missing element', () => {
            expect(list.lastIndexOf(1)).to.equal(-1);
            expect(list.lastIndexOf(20, 6)).to.equal(-1);
          });

        });

        describe('pop()', () => {

          it('returns last element', () => {
            expect(list.pop()).to.equal(11);
          });

          it('returns undefined for empty array', () => {
            expect([].pop()).to.be.undefined;
          });

          it('removes last element', () => {
            list.pop();

            expect(list.length).to.equal(19);
            expect(Array.from(list)).to.deep.equal(data.slice(0, -1));
          });

        });

        describe('push()', () => {

          it('adds given element', () => {
            list.push(0);

            expect(list.length).to.equal(21);
            expect(list[20]).to.equal(0);
          });

          it('adds multiple elements', () => {
            list.push(100, 101, 102);

            expect(list.length).to.equal(23);
            expect(list[20]).to.equal(100);
            expect(list[21]).to.equal(101);
            expect(list[22]).to.equal(102);
          });

          it('returns new array length', () => {
            expect(list.push(100, 101, 102)).to.equal(23);
          });

        });

        describe('shift()', () => {

          it('returns first element', () => {
            expect(list.shift()).to.equal(10);
          });

          it('returns undefined for empty array', () => {
            expect([].shift()).to.be.undefined;
          });

          it('removes first element', () => {
            list.shift();

            expect(list.length).to.equal(19);
            expect(Array.from(list)).to.deep.equal(data.slice(1));
          });

        });

        describe('splice()', () => {

          it('inserts single element', () => {
            const removed = list.splice(2, 0, 1);

            expect(removed).to.deep.equal([]);
            expect(list.length).to.equal(21);
            expect(list[1]).to.equal(11);
            expect(list[2]).to.equal(1);
            expect(list[3]).to.equal(12);
          });

          it('inserts multiple elements', () => {
            const removed = list.splice(2, 0, 2, 3);

            expect(removed).to.deep.equal([]);
            expect(list.length).to.equal(22);
            expect(list[1]).to.equal(11);
            expect(list[2]).to.equal(2);
            expect(list[3]).to.equal(3);
            expect(list[4]).to.equal(12);
          });

          it('removes single element', () => {
            const removed = list.splice(3, 1);

            expect(removed).to.deep.equal([13]);
            expect(list.length).to.equal(19);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(14);
          });

          it('removes multiple elements', () => {
            const removed = list.splice(3, 2);

            expect(removed).to.deep.equal([13, 14]);
            expect(list.length).to.equal(18);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(15);
          });

          it('replaces single element', () => {
            const removed = list.splice(3, 1, 101);

            expect(removed).to.deep.equal([13]);
            expect(list.length).to.equal(20);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(101);
            expect(list[4]).to.equal(14);
          });

          it('rounds deleteCount', () => {
            const removed = list.splice(3, 1.4, 101);

            expect(removed).to.deep.equal([13]);
            expect(list.length).to.equal(20);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(101);
            expect(list[4]).to.equal(14);
          });

          it('converts deleteCount', () => {
            const removed = list.splice(3, '1.4' as any, 101);

            expect(removed).to.deep.equal([13]);
            expect(list.length).to.equal(20);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(101);
            expect(list[4]).to.equal(14);
          });

          it('replaces multiple elements with more elements', () => {
            const removed = list.splice(3, 2, 101, 102, 103);

            expect(removed).to.deep.equal([13, 14]);
            expect(list.length).to.equal(21);
            expect(list[2]).to.equal(12);
            expect(list[3]).to.equal(101);
            expect(list[4]).to.equal(102);
            expect(list[5]).to.equal(103);
            expect(list[6]).to.equal(15);
          });

          it('removes single element from given negative index', () => {
            const removed = list.splice(-2, 1);

            expect(removed).to.deep.equal([12]);
            expect(list.length).to.equal(19);
            expect(list[17]).to.equal(13);
            expect(list[18]).to.equal(11);
          });

          it('removes all elements after given index', () => {
            const removed = list.splice(18);

            expect(removed).to.deep.equal([12, 11]);
            expect(list.length).to.equal(18);
            expect(list[17]).to.equal(13);
          });

          it('removes all elements after given index if delete count is out of bounds', () => {
            const removed = list.splice(18, 100);

            expect(removed).to.deep.equal([12, 11]);
            expect(list.length).to.equal(18);
            expect(list[17]).to.equal(13);
          });

          it('does nothing if start index is too great', () => {
            const removed = list.splice(20, 1);

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('does nothing if start index is Infinity', () => {
            const removed = list.splice(Infinity, 1);

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('deletes nothing if delete count is negative', () => {
            const removed = list.splice(1, -1);

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('trims right if delete count is Infinity', () => {
            const removed = list.splice(1, Infinity);

            expect(removed).to.deep.equal(data.slice(1));
            expect(Array.from(list)).to.deep.equal([10]);
          });

          it('deletes nothing if delete count is null', () => {
            const removed = list.splice(1, null);

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('deletes nothing if delete count is undefined', () => {
            const removed = list.splice(1, undefined);

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('does nothing if no arguments are given', () => {
            const removed = (list as any).splice();

            expect(removed).to.deep.equal([]);
            expect(Array.from(list)).to.deep.equal(data);
          });

          it('converts start index number string to number', () => {
            const removed = list.splice('10' as any);

            expect(removed).to.deep.equal(data.slice(10));
            expect(Array.from(list)).to.deep.equal(data.slice(0, 10));
          });

          it('rounds start index', () => {
            const removed = list.splice(10.4);

            expect(removed).to.deep.equal(data.slice(10));
            expect(Array.from(list)).to.deep.equal(data.slice(0, 10));
          });

          it('treats start index NaN as 0', () => {
            const removed = list.splice(NaN);

            expect(removed).to.deep.equal(data);
            expect(Array.from(list)).to.deep.equal([]);
          });

          it('treats start index non-number-string as 0', () => {
            const removed = list.splice('foo' as any);

            expect(removed).to.deep.equal(data);
            expect(Array.from(list)).to.deep.equal([]);
          });

          it('treats start index null as 0', () => {
            const removed = list.splice(null);

            expect(removed).to.deep.equal(data);
            expect(Array.from(list)).to.deep.equal([]);
          });

          it('treats start index undefined as 0', () => {
            const removed = list.splice(null);

            expect(removed).to.deep.equal(data);
            expect(Array.from(list)).to.deep.equal([]);
          });

          it('treats start index true as 1', () => {
            const removed = (list as any).splice(true);

            expect(removed).to.deep.equal(data.slice(1));
            expect(list.length).to.equal(1);
          });

        });

        describe('unshift()', () => {

          it('adds given element', () => {
            list.unshift(0);

            expect(list.length).to.equal(21);
            expect(list[0]).to.equal(0);
          });

          it('adds multiple elements', () => {
            list.unshift(100, 101, 102);

            expect(list.length).to.equal(23);
            expect(list[0]).to.equal(100);
            expect(list[1]).to.equal(101);
            expect(list[2]).to.equal(102);
          });

          it('returns new array length', () => {
            expect(list.unshift(100, 101, 102)).to.equal(23);
          });

        });

        describe('values()', () => {

          it('is iterator', () => {
            const results: Array<IteratorResult<number>> = [];
            const values = list.values();

            while (!results.length || !results[results.length - 1].done) {
              results.push(values.next());
            }

            expect(results.length).to.equal(21);
            expect(results[0]).to.deep.equal({done: false, value: 10});
            expect(results[1]).to.deep.equal({done: false, value: 11});
            expect(results[19]).to.deep.equal({done: false, value: 11});
            expect(results[20]).to.deep.equal({done: true, value: undefined});
          });

          it('is iterable', () => {
            let last: number = null;
            let count = 0;

            for (const entry of list.values()) {
              count++;
              last = entry;
            }

            expect(count).to.equal(20);
            expect(last).to.deep.equal(11);
          });

      });

      });

    });

  });

  describe('Mutation events:', () => {

    let list: List<number>;
    let mutations: Array<Partial<Mutation<number>>>;
    let control: number[];
    const mirror = () => {
      mutations.forEach(({start: startIndex, deleteCount, items}) => {
        control.splice(startIndex, deleteCount, ...items);
      });
      return control;
    };

    beforeEach(() => {
      list = List.from(data);
      control = Array.from(data);
      mutations = [];
      listObservers(list).addListener(
        ({start, deleteCount, items}) => mutations.push({start, deleteCount, items})
      );
    });

    describe('length', () => {

      it('increase', () => {
        list.length = 5;

        expect(mutations).to.deep.equal([
          {start: 5, deleteCount: 15, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('increase (via number string)', () => {
        list.length = '5' as any;

        expect(mutations).to.deep.equal([
          {start: 5, deleteCount: 15, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('decrease', () => {
        list.length = 30;

        expect(mutations).to.deep.equal([
          {start: 20, deleteCount: 0, items: new Array(10)}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
        expect(list[29]).to.be.undefined;
        expect(29 in list).to.be.false;
      });

    });

    describe('read/write', () => {

      it('value change (by index number)', () => {
        list[0] = 100;

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 1, items: [100]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('changes value (by index string)', () => {
        list['0'] = 100;

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 1, items: [100]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('length change', () => {
        list.length = 3;
        list[5] = 3;

        const items = new Array(3);
        items[2] = 3;
        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 17, items: []},
          {start: 3, deleteCount: 0, items}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('entry deletion', () => {
        delete list[2];

        expect(mutations).to.deep.equal([
          {start: 2, deleteCount: 1, items: new Array(1)}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

    });

    describe('pop()', () => {

      it('last element removal', () => {
        list.pop();

        expect(mutations).to.deep.equal([
          {start: 19, deleteCount: 1, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

    });

    describe('push()', () => {

      it('no change', () => {
        list.push();

        expect(mutations).to.deep.equal([]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element insertion', () => {
        list.push(0);

        expect(mutations).to.deep.equal([
          {start: 20, deleteCount: 0, items: [0]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('multiple element insertion', () => {
        list.push(100, 101, 102);

        expect(mutations).to.deep.equal([
          {start: 20, deleteCount: 0, items: [100, 101, 102]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

    });

    describe('shift()', () => {

      it('removes first element', () => {
        list.shift();

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 1, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

    });

    describe('splice()', () => {

      it('single element insertion', () => {
        list.splice(2, 0, 1);

        expect(mutations).to.deep.equal([
          {start: 2, deleteCount: 0, items: [1]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('multiple element insertion', () => {
        list.splice(2, 0, 2, 3);

        expect(mutations).to.deep.equal([
          {start: 2, deleteCount: 0, items: [2, 3]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element removal', () => {
        list.splice(3, 1);

        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 1, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('multiple element removal', () => {
        list.splice(3, 2);

        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 2, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element replacement', () => {
        list.splice(3, 1, 101);

        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 1, items: [101]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element replacement (via number-strings)', () => {
        list.splice('3' as any, '1' as any, 101);

        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 1, items: [101]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('multiple elements replacement with more elements', () => {
        list.splice(3, 2, 101, 102, 103);

        expect(mutations).to.deep.equal([
          {start: 3, deleteCount: 2, items: [101, 102, 103]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element removal via negative index', () => {
        list.splice(-2, 1);

        expect(mutations).to.deep.equal([
          {start: 18, deleteCount: 1, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('right trim (no delete count)', () => {
        list.splice(18);

        expect(mutations).to.deep.equal([
          {start: 18, deleteCount: 2, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('right trim (delete count is out of bounds)', () => {
        list.splice(18, 100);

        expect(mutations).to.deep.equal([
          {start: 18, deleteCount: 2, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('remove all (startIndex is non-number-string)', () => {
        list.splice('foo' as any);

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 20, items: []}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('no change (index out of bounds)', () => {
        list.splice(400, 1);

        expect(mutations).to.deep.equal([]);
        expect(Array.from(list)).to.deep.equal(data);
      });

      it('no change (deleteCount is negative)', () => {
        list.splice(1, -1);

        expect(mutations).to.deep.equal([]);
        expect(Array.from(list)).to.deep.equal(data);
      });

      it('no change (deleteCount is null)', () => {
        list.splice(1, null);

        expect(mutations).to.deep.equal([]);
        expect(Array.from(list)).to.deep.equal(data);
      });

      it('no change (deleteCount is undefined)', () => {
        list.splice(1, undefined);

        expect(mutations).to.deep.equal([]);
        expect(Array.from(list)).to.deep.equal(data);
      });

    });

    describe('unshift()', () => {

      it('no change', () => {
        list.unshift();

        expect(mutations).to.deep.equal([]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('single element insertion', () => {
        list.unshift(0);

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 0, items: [0]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

      it('multiple element insertions', () => {
        list.unshift(100, 101, 102);

        expect(mutations).to.deep.equal([
          {start: 0, deleteCount: 0, items: [100, 101, 102]}
        ]);
        expect(mirror()).to.deep.equal(Array.from(list));
      });

    });

  });

});
