import * as deepEquals from 'equals';
import 'mocha';
import 'sinon';
import 'tabris';
import {Color, Constraint, Font, LayoutData, LinearGradient, Percent} from 'tabris';
import {expect, stub} from './test';
import {CompareMode, equals} from '../src';

describe('equals', () => {

  const sym1 = Symbol();
  const sym2 = Symbol();
  let compare: (a, b) => boolean;
  let valueOf: () => unknown;
  let customEquals: (value: any) => boolean;
  let customValueOf: () => unknown;
  const modes: CompareMode[] = ['auto', 'strict', 'shallow'];

  beforeEach(() => {
    compare = stub().returns(false);
    valueOf = stub().returnsThis();
    customEquals = function(value) {
      return compare(this, value);
    };
    customValueOf = function() {
      return valueOf.call(this);
    };
  });

  it('throws for invalid mode', function() {
    expect(() => equals([1, 1], undefined)).to.throw(Error, 'Invalid mode');
    expect(() => equals([1, 1], null)).to.throw(Error, 'Invalid mode');
    expect(() => equals([1, 1], 'foo' as any)).to.throw(Error, 'Invalid mode');
  });

  describe('with primitives', () => {

    modes.forEach(mode => describe(`mode ${mode}`, () => {

      it('returns false for non-equal values', () => {
        expect(equals([-1, 1], mode)).to.be.false;
        expect(equals([0, 0.1], mode)).to.be.false;
        expect(equals([1, '1'], mode)).to.be.false;
        expect(equals([Infinity, NaN], mode)).to.be.false;
        expect(equals(['NaN', NaN], mode)).to.be.false;
        expect(equals([Infinity, -Infinity], mode)).to.be.false;
        expect(equals(['foo', 'bar'], mode)).to.be.false;
        expect(equals([true, 1], mode)).to.be.false;
        expect(equals([false, 'false'], mode)).to.be.false;
        expect(equals([null, false], mode)).to.be.false;
        expect(equals(['str', {toString() { return 'str'; }}], mode)).to.be.false;
        expect(equals([null, undefined], mode)).to.be.false;
        expect(equals([sym1, sym2], mode)).to.be.false;
      });

      it('returns true for equal values', () => {
        expect(equals([-1, -1], mode)).to.be.true;
        expect(equals([Infinity, Infinity], mode)).to.be.true;
        expect(equals([-Infinity, -Infinity], mode)).to.be.true;
        expect(equals([NaN, NaN], mode)).to.be.true;
        expect(equals([0.1, 0.1], mode)).to.be.true;
        expect(equals(['1', '1'], mode)).to.be.true;
        expect(equals(['foo', 'foo'], mode)).to.be.true;
        expect(equals([true, true], mode)).to.be.true;
        expect(equals([false, false], mode)).to.be.true;
        expect(equals([sym1, sym1], mode)).to.be.true;
        expect(equals([null, null], mode)).to.be.true;
        expect(equals([undefined, undefined], mode)).to.be.true;
      });

    }));

  });

  describe('with compare function', () => {

    it('does not call function with identical values', () => {
      equals([1, 1], compare);

      expect(compare).not.to.have.been.called;
    });

    it('calls function with values once', () => {
      equals([1, 2], compare);

      expect(compare).to.have.been.calledOnceWith(1, 2);
    });

    it('returns value from compare function', () => {
      expect(equals([1, 2], () => true)).to.be.true;
      expect(equals([1, 2], () => false)).to.be.false;
    });

    it('throws if function returns non-boolean', () => {
      expect(() => equals([1, 2], () => null)).to.throw(Error,
        'Invalid return value of compare function: Expected value to be of type boolean, but found null.'
      );
    });

    it('throws if function throws', () => {
      expect(() => equals(
        [true, false],
        () => { throw new Error('foo'); }
      )).to.throw(Error, 'foo');
    });

    it('works with "equals" module', () => {
      const valueA = {foo: [{bar: {baz: 27}}]};
      const valueB = {foo: [{bar: {baz: 27}}]};
      const valueC = {foo: [{bar: {baz: null}}]};
      const valueD = {foo: [{bar: {baz: null}}]};
      valueC.foo[0].bar.baz = valueC;
      valueD.foo[0].bar.baz = valueD;

      expect(equals([valueA, valueB], deepEquals)).to.be.true;
      expect(equals([valueB, valueC], deepEquals)).to.be.false;
      expect(equals([valueC, valueD], deepEquals)).to.be.true;
    });

  });

  describe('mode strict', () => {

    it('returns false for different objects', () => {
      compare = stub().returns(true);
      expect(equals([() => {}, () => {}], 'strict')).to.be.false;
      expect(equals([{}, {}], 'strict')).to.be.false;
      expect(equals([[], []], 'strict')).to.be.false;
      expect(equals(
        [{toString() { return 'str'; }}, {toString() { return 'str'; }}], 'strict'
      )).to.be.false;
      expect(equals(
        [{equals: customEquals}, {equals: customEquals}], 'strict'
      )).to.be.false;
      expect(equals(
        [{valueOf: customValueOf}, {valueOf: customValueOf}], 'strict'
      )).to.be.false;
      expect(compare).not.to.have.been.called;
      expect(valueOf).not.to.have.been.called;
    });

    it('returns true for same objects', () => {
      const fn = () => {};
      const object = {};
      const array = [];
      const stringify = {toString() { return 'str'; }};
      const customEqualsObj = {equals: customEquals};
      expect(equals([fn, fn], 'strict')).to.be.true;
      expect(equals([object, object], 'strict')).to.be.true;
      expect(equals([array, array], 'strict')).to.be.true;
      expect(equals([stringify, stringify], 'strict')).to.be.true;
      expect(equals([customEqualsObj, customEqualsObj], 'strict')).to.be.true;
      expect(equals([customValueOf, customValueOf], 'strict')).to.be.true;
      expect(compare).not.to.have.been.called;
      expect(valueOf).not.to.have.been.called;
    });

  });

  describe('mode shallow', () => {

    it('returns true for same objects', () => {
      const fn = () => {};
      const object = {};
      const array = [];
      const stringify = {toString() { return 'str'; }};
      const customEqualsObj = {equals: customEquals};
      const customValueOfObj = {valueOf: customValueOf};
      expect(equals([fn, fn], 'strict')).to.be.true;
      expect(equals([object, object], 'strict')).to.be.true;
      expect(equals([array, array], 'strict')).to.be.true;
      expect(equals([stringify, stringify], 'strict')).to.be.true;
      expect(equals([customEqualsObj, customEqualsObj], 'strict')).to.be.true;
      expect(equals([customValueOfObj, customValueOfObj], 'strict')).to.be.true;
      expect(compare).not.to.have.been.called;
      expect(valueOf).not.to.have.been.called;
    });

    it('returns true for shallow-equal plain objects', function() {
      const child = {};
      expect(equals([{bar: 1, baz: child}, {bar: 1, baz: child}],'shallow')).to.be.true;
    });

    it('returns true for shallow-equal object subclasses', function() {
      class CustomObjectA {
        foo() { return Math.random(); }
        get bar() { return 1; }
      }
      class CustomObjectB extends CustomObjectA { baz = 2; }
      expect(equals([new CustomObjectA(), new CustomObjectA()], 'shallow')).to.be.true;
      expect(equals([new CustomObjectB(), new CustomObjectB()], 'shallow')).to.be.true;
    });

    it('returns true for shallow-equal plain arrays', function() {
      const child = {};
      expect(equals([[1, child], [1, child]], 'shallow')).to.be.true;
    });

    it('returns true for arrays that have empty slots and undefined at the same indices', function() {
      const a = [undefined, 1, undefined];
      const b = [];
      b[1] = 1;
      b.length = 3;
      expect(equals([a, b], 'shallow')).to.be.true;
      expect(equals([b, a], 'shallow')).to.be.true;
    });

    it('returns true for shallow-equal array subclasses', function() {
      class CustomArray extends Array {}
      const a = new CustomArray();
      const b = new CustomArray();
      a[0] = 1; a[1] = 2;
      b[0] = 1; b[1] = 2;
      expect(equals([a, b], 'shallow')).to.be.true;
      expect(equals([b, a], 'shallow')).to.be.true;
    });

    it('returns false for shallow-equal objects of different classes', function() {
      class CustomObjectA {bar: 1;}
      class CustomObjectB extends CustomObjectA {}
      expect(equals([new CustomObjectA(), new CustomObjectB()], 'shallow')).to.be.false;
      expect(equals([new CustomObjectB(), new CustomObjectA()], 'shallow')).to.be.false;
      expect(equals([{bar: 1}, new CustomObjectA()], 'shallow')).to.be.false;
      expect(equals([new CustomObjectA(), {bar: 1}], 'shallow')).to.be.false;
    });

    it('returns false for non-shallow-equal plain objects', function() {
      const child = {};
      expect(equals([{bar: 1, baz: child}, {bar: 2, baz: child}], 'shallow')).to.be.false;
      expect(equals([{bar: 1, baz: child}, {bar: 1, baz: {}}], 'shallow')).to.be.false;
      expect(equals([{bar: 1}, {bar: 1, baz: undefined}], 'shallow')).to.be.false;
      expect(equals([{bar: 1, baz: undefined}, {bar: 1}], 'shallow')).to.be.false;
    });

    it('returns false for plain objects with different non-enumerable values', function() {
      const objectA = {};
      const objectB = {};
      Object.defineProperty(objectA, 'foo', {enumerable: false, value: 1});
      Object.defineProperty(objectB, 'foo', {enumerable: false, value: 2});
      expect(equals([objectA, objectB], 'shallow')).to.be.false;
      expect(equals([objectB, objectA], 'shallow')).to.be.false;
    });

    it('returns false for non-shallow-equal plain arrays', function() {
      const child = {};
      expect(equals([[1, child], [2, child]], 'shallow')).to.be.false;
      expect(equals([[1, child], [1, {}]], 'shallow')).to.be.false;
    });

    it('returns false for arrays containing different falsy values', function() {
      expect(equals([[1, null], [2, undefined]], 'shallow')).to.be.false;
      expect(equals([[1, ''], [1, null]], 'shallow')).to.be.false;
    });

    it('returns false for for shallow-equal array of different subclasses', function() {
      class CustomArrayA extends Array {}
      class CustomArrayB extends CustomArrayA {}
      const a = new CustomArrayA();
      const b = new CustomArrayB();
      a[0] = 1; a[1] = 2;
      b[0] = 1; b[1] = 2;
      expect(equals([a, b], 'shallow')).to.be.false;
      expect(equals([b, a], 'shallow')).to.be.false;
      expect(equals([a, [1, 2]], 'shallow')).to.be.false;
      expect(equals([[1, 2], b], 'shallow')).to.be.false;
    });

    it('returns false for arrays with different length', function() {
      const shorter = [1, 2];
      const longer = [1, 2, 3];
      expect(equals([shorter, longer], 'shallow')).to.be.false;
      expect(equals([longer, shorter], 'shallow')).to.be.false;
    });

    it('returns false for 2nd-level-unequal plain arrays', function() {
      expect(equals([[1, {foo: 1}], [1, {foo: 2}]], 'shallow')).to.be.false;
    });

    it('returns false for 3d-level-equal plain arrays', function() {
      expect(equals([[1, {foo: {bar: 1}}], [1, {foo: {bar: 1}}]], 'shallow')).to.be.false;
    });

    it('returns false for different functions', function() {
      expect(equals([() => true, () => true], 'shallow')).to.be.false;
    });

  });

  describe('mode auto', () => {

    it('returns true for shallow-equal plain objects', function() {
      const child = {};
      expect(equals([{bar: 1, baz: child}, {bar: 1, baz: child}], 'auto')).to.be.true;
    });

    it('returns true for shallow-equal plain arrays', function() {
      const child = {};
      expect(equals([[1, child], [1, child]],'auto')).to.be.true;
    });

    it('returns false for non-shallow-equal plain objects', function() {
      expect(equals([{bar: 1, baz: {}}, {bar: 1, baz: {}}], 'auto')).to.be.false;
    });

    it('returns false for non-shallow-equal plain arrays', function() {
      expect(equals([[1, {}], [1, {}]], 'auto')).to.be.false;
    });

    it('returns false for shallow-equal object subclasses', function() {
      class CustomObject { baz = 2; }
      expect(equals([new CustomObject(), new CustomObject()], 'auto')).to.be.false;
    });

    it('returns false for shallow-equal array subclasses', function() {
      class CustomArray extends Array {}
      const a = new CustomArray();
      const b = new CustomArray();
      a[0] = 1; a[1] = 2;
      b[0] = 1; b[1] = 2;
      expect(equals([a, b], 'auto')).to.be.false;
      expect(equals([b, a], 'auto')).to.be.false;
    });

    describe('with custom equals', () => {

      class CustomEqualsObject {
        equals = customEquals;
      }

      let valueA: CustomEqualsObject;
      let valueB: CustomEqualsObject;

      beforeEach(() => {
        valueA = new CustomEqualsObject();
        valueB = new CustomEqualsObject();
      });

      it('does not call custom equals on identical objects', () => {
        equals([valueA, valueA], 'auto');

        expect(compare).not.to.have.been.called;
      });

      it('does not call non-identical custom equals functions', () => {
        valueB.equals = function(value) { return compare(this, value); };

        equals([valueA, valueB], 'auto');

        expect(compare).not.to.have.been.called;
      });

      it('does not call custom equals if it takes two parameters', () => {
        valueA.equals = valueA.equals = function(a, b) {
          return compare(a, b);
        } as any;

        equals([valueA, valueB], 'auto');

        expect(compare).not.to.have.been.called;
      });

      it('calls custom equals with other value', () => {
        equals([valueA, valueB], 'auto');

        expect(compare).to.have.been.calledOnceWith(valueA, valueB);
      });

      it('returns true if custom equals returns true', () => {
        compare = () => true;

        expect(equals([valueA, valueB], 'auto')).to.be.true;
        expect(equals([valueB, valueA], 'auto')).to.be.true;
      });

      it('returns false if custom equals returns false', () => {
        compare = () => false;

        expect(equals([valueA, valueB], 'auto')).to.be.false;
        expect(equals([valueB, valueA], 'auto')).to.be.false;
      });

      it('throws if custom equals returns non boolean', () => {
        compare = () => 'foo' as any;

        expect(() => equals([valueA, valueB], 'auto')).to.throw(Error,
          'Invalid return value of "equals" method: Expected value "foo" to be of type boolean, but found string.'
        );
      });

      it('throws if custom equals throws', () => {
        compare = () => { throw new Error('foo'); };

        expect(() => equals([valueA, valueB], 'auto')).to.throw(Error, 'foo');
      });

      it('works with built-in data types', () => {
        const colorA = () => new Color(1, 2, 3);
        const colorB = () => new Color(0, 2, 3);
        const fontA = () => new Font(2, ['serif']);
        const fontB = () => new Font(2, ['san-serif']);
        const gradientA = () => new LinearGradient([colorA(), colorB()]);
        const gradientB = () => new LinearGradient([colorB(), colorA()]);
        const constraintA = () => new Constraint(new Percent(10), 10);
        const constraintB = () => new Constraint(new Percent(10), 11);
        const layoutDataA = () => new LayoutData({width: 100, top: constraintA()});
        const layoutDataB = () => new LayoutData({width: 100, top: constraintB()});

        expect(equals([colorA(), colorB()], 'auto')).to.be.false;
        expect(equals([colorA(), colorA()], 'auto')).to.be.true;
        expect(equals([fontA(), fontB()], 'auto')).to.be.false;
        expect(equals([fontA(), fontA()], 'auto')).to.be.true;
        expect(equals([gradientA(), gradientB()], 'auto')).to.be.false;
        expect(equals([gradientA(), gradientA()], 'auto')).to.be.true;
        expect(equals([constraintA(), constraintB()], 'auto')).to.be.false;
        expect(equals([constraintA(), constraintA()], 'auto')).to.be.true;
        expect(equals([layoutDataA(), layoutDataB()], 'auto')).to.be.false;
        expect(equals([layoutDataA(), layoutDataA()], 'auto')).to.be.true;
      });

    });

    describe('with custom valueOf', () => {

      class CustomValueOfObject {
        valueOf = customValueOf;
        equals;
      }

      let valueA: CustomValueOfObject;
      let valueB: CustomValueOfObject;

      beforeEach(() => {
        valueA = new CustomValueOfObject();
        valueB = new CustomValueOfObject();
      });

      it('does not call custom valueOf on identical objects', () => {
        equals([valueA, valueA], 'auto');

        expect(valueOf).not.to.have.been.called;
      });

      it('does not call custom valueOf on objects with custom equals', () => {
        valueA.equals = customEquals;
        valueB.equals = customEquals;
        equals([valueA, valueB], 'auto');

        expect(valueOf).not.to.have.been.called;
        expect(compare).to.have.been.called;
      });

      it('does not call non-identical custom valueOf functions', () => {
        valueB.valueOf = () => valueB;

        equals([valueA, valueB], 'auto');

        expect(valueOf).not.to.have.been.called;
      });

      it('does not call custom valueOf if it takes parameters', () => {
        valueA.valueOf = valueA.valueOf = function(a) {
          return valueOf.call(this, a);
        } as any;

        equals([valueA, valueB], 'auto');

        expect(valueOf).not.to.have.been.called;
      });

      it('calls custom valueOf for both values', () => {
        equals([valueA, valueB], 'auto');

        expect(valueOf).to.have.been.calledTwice;
        expect(valueOf).to.have.been.calledOn(valueA);
        expect(valueOf).to.have.been.calledOn(valueB);
      });

      it('returns true if valueOf returns same primitives', () => {
        valueOf = () => 12;

        expect(equals([valueA, valueB], 'auto')).to.be.true;
        expect(equals([valueB, valueA], 'auto')).to.be.true;
      });

      it('returns false if custom equals returns different primitives', () => {
        valueA.valueOf = () => 1;
        valueB.valueOf = () => 2;

        expect(equals([valueA, valueB], 'auto')).to.be.false;
        expect(equals([valueB, valueA], 'auto')).to.be.false;
      });

      it('returns false if custom equals returns objects', () => {
        const obj = {};
        valueA.valueOf = () => obj;
        valueB.valueOf = () => obj;

        expect(equals([valueA, valueB], 'auto')).to.be.false;
        expect(equals([valueB, valueA], 'auto')).to.be.false;
      });

      it('throws if custom valueOf throws', () => {
        valueOf = () => { throw new Error('foo'); };

        expect(() => equals([valueA, valueB], 'auto')).to.throw(Error, 'foo');
      });

      it('works with Percent', () => {
        const percentA = () => new Percent(10);
        const percentB = () => new Percent(20);

        expect(equals([percentA(), percentB()], 'auto')).to.be.false;
        expect(equals([percentA(), percentA()], 'auto')).to.be.true;
      });

      it('works with Date', () => {
        const dateA = () => new Date(10);
        const dateB = () => new Date(20);

        expect(equals([dateA(), dateB()], 'auto')).to.be.false;
        expect(equals([dateA(), dateA()], 'auto')).to.be.true;
      });

    });

  });

});
