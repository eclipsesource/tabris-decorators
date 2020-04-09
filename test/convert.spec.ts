import 'mocha';
import 'sinon';
import 'tabris';
import {Color, Constraint, Font, Image, LayoutData, LinearGradient, NativeObject, Percent, TextView, Widget} from 'tabris';
import {expect, stub} from './test';
import {convert} from '../src';

describe('convert', () => {

  const percent = new Percent(40);
  const color = new Color(0, 1, 2);
  const font = new Font(23);
  const constraint = new Constraint('#foo', 0);
  const layoutData = new LayoutData({width: 40});
  const gradient = new LinearGradient([new Color(0, 0, 0), new Color(1, 0, 0)]);
  const image = new Image({src: 'foo.png'});

  it('throws for invalid type', function() {
    expect(() => convert({}, undefined)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, null)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, (() => {}) as any)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, Object)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, NativeObject)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, Widget)).to.throw(Error, 'Invalid type');
    expect(() => convert({}, TextView)).to.throw(Error, 'Invalid type');
  });

  describe('to number', () => {

    it('from number', () => {
      expect(convert(0, Number)).to.equal(0);
      expect(convert(+0, Number)).to.equal(0);
      expect(convert(-0, Number)).to.equal(0);
      expect(convert(2, Number)).to.equal(2);
      expect(convert(-2, Number)).to.equal(-2);
      expect(convert(23.4, Number)).to.equal(23.4);
      expect(convert(0x00, Number)).to.equal(0);
      expect(convert(0xff, Number)).to.equal(255);
      expect(convert(Infinity, Number)).to.equal(Infinity);
      expect(convert(-Infinity, Number)).to.equal(-Infinity);
    });

    it('from string', () => {
      expect(convert(JSON.stringify(12), Number)).to.equal(12);
      expect(convert('', Number)).to.equal(0);
      expect(convert(' ', Number)).to.equal(0);
      expect(convert('0', Number)).to.equal(0);
      expect(convert('+0', Number)).to.equal(0);
      expect(convert('-0', Number)).to.equal(0);
      expect(convert('2', Number)).to.equal(2);
      expect(convert('-2', Number)).to.equal(-2);
      expect(convert(' -2 ', Number)).to.equal(-2);
      expect(convert('23.4', Number)).to.equal(23.4);
      expect(convert('0x00', Number)).to.equal(0);
      expect(convert('0xff', Number)).to.equal(255);
      expect(convert('23.4', Number)).to.equal(23.4);
      expect(convert('InfinIty', Number)).to.equal(Infinity);
      expect(convert('-infinity', Number)).to.equal(-Infinity);
      expect(convert('NaN', Number)).to.be.NaN;
    });

    it('from boolean', () => {
      expect(convert(true, Number)).to.equal(1);
      expect(convert(false, Number)).to.equal(0);
    });

    it('from null and undefined', () => {
      expect(convert(null, Number)).to.equal(0);
      expect(convert(undefined, Number)).to.equal(0);
    });

    it('from Object', () => {
      expect(convert(new Number(23), Number)).to.equal(23);
      expect(convert({toString: () => '23'}, Number)).to.equal(23);
      expect(convert({valueOf: () => 23, toString: () => 'foo'}, Number)).to.equal(23);
      expect(convert({value: 23}, Number)).to.equal(23);
      expect(convert(new Date(23), Number)).to.equal(23);
      expect(convert(new Percent(23), Number)).to.equal(23);
      expect(convert([23], Number)).to.equal(23);
      expect(convert(percent, Number)).to.equal(40);
    });

    it('fails for non-convertable values', () => {
      [
        'foo', {}, {value: true}, [1, 2, 3], [true], font,
        constraint, layoutData, gradient, image
      ].forEach(value =>
        expect(() => convert(value, Number)).to.throw(Error, 'Can not convert')
      );
    });

  });

  describe('to boolean', () => {

    it('from boolean', () => {
      expect(convert(true, Boolean)).to.equal(true);
      expect(convert(false, Boolean)).to.equal(false);
    });

    it('from string', () => {
      expect(convert('', Boolean)).to.equal(false);
      expect(convert(' ', Boolean)).to.equal(false);
      expect(convert('false', Boolean)).to.equal(false);
      expect(convert(' trUe ', Boolean)).to.equal(true);
      expect(convert(convert(true, String), Boolean)).to.equal(true);
      expect(convert(convert(false, String), Boolean)).to.equal(false);
      expect(convert(JSON.stringify(true), Boolean)).to.equal(true);
      expect(convert(JSON.stringify(false), Boolean)).to.equal(false);
    });

    it('from number', () => {
      expect(convert(1, Boolean)).to.equal(true);
      expect(convert(0.4, Boolean)).to.equal(true);
      expect(convert(0, Boolean)).to.equal(false);
      expect(convert(-1, Boolean)).to.equal(false);
      expect(convert(NaN, Boolean)).to.equal(false);
      expect(convert(Infinity, Boolean)).to.equal(true);
      expect(convert(-Infinity, Boolean)).to.equal(false);
    });

    it('from null and undefined', () => {
      expect(convert(null, Boolean)).to.equal(false);
      expect(convert(undefined, Boolean)).to.equal(false);
    });

    it('from Object', () => {
      expect(convert(new Boolean(true), Boolean)).to.equal(true);
      expect(convert(new Boolean(false), Boolean)).to.equal(false);
      expect(convert(new String('true'), Boolean)).to.equal(true);
      expect(convert(new String('false'), Boolean)).to.equal(false);
      expect(convert({toString: () => 'true'}, Boolean)).to.equal(true);
      expect(convert({toString: () => '0'}, Boolean)).to.equal(false);
      expect(convert({valueOf: () => true, toString: () => 'false'}, Boolean)).to.equal(true);
      expect(convert({valueOf: () => false, toString: () => 'true'}, Boolean)).to.equal(false);
      expect(convert([true], Boolean)).to.equal(true);
      expect(convert([false], Boolean)).to.equal(false);
    });

    it('fails for non-convertable values', () => {
      [
        'foo', {}, {value: 23}, [1, 2, 3], [true, false], font,
        constraint, layoutData, gradient, image, color
      ].forEach(value =>
        expect(() => convert(value, Boolean)).to.throw(Error, 'Can not convert')
      );
    });

  });

  describe('to string', () => {

    it('from string', () => {
      expect(convert('foo', String)).to.equal('foo');
      expect(convert(new String('foo'), String)).to.equal('foo');
    });

    it('from boolean', () => {
      expect(convert(false, String)).to.equal('false');
      expect(convert(true, String)).to.equal('true');
      expect(convert(convert('false', Boolean), String)).to.equal('false');
      expect(convert(convert('true', Boolean), String)).to.equal('true');
    });

    it('from number', () => {
      expect(convert(1, String)).to.equal('1');
      expect(convert(0, String)).to.equal('0');
      expect(convert(1.2, String)).to.equal('1.2');
      expect(convert(-4, String)).to.equal('-4');
      expect(convert(Infinity, String)).to.equal('infinity');
      expect(convert(NaN, String)).to.equal('');
      expect(convert(convert('-4', Number), String)).to.equal('-4');
    });

    it('from null and undefined', () => {
      expect(convert(null, String)).to.equal('');
      expect(convert(undefined, String)).to.equal('');
    });

    it('from Array', () => {
      expect(convert(['foo'], String)).to.equal('foo');
      expect(convert(['foo', 23], String)).to.equal('foo, 23');
      expect(convert(['foo', {}], String)).to.equal('foo, object');
    });

    it('from typed array', () => {
      // Can not be done until TextDecoder is public API
      const arr = new Int16Array([0, 1, 2]);
      expect(() => convert(arr, String)).to.throw(Error, 'Can not convert');
      expect(() => convert(arr.buffer, String)).to.throw(Error, 'Can not convert');
    });

    it('from function', () => {
      expect(convert(() => 'foo', String)).to.equal('foo');
      expect(convert(function foo() {throw new Error('bar');}, String)).to.equal('bar');
      expect(convert(class FooBar {}, String)).to.equal('FooBar');
      expect(convert(class {}, String)).to.equal('function');
    });

    it('from object literal', () => {
      expect(convert({toString: () => 'foo'}, String)).to.equal('foo');
      expect(convert({valueOf: () => 'foo', toString: () => 'bar'}, String)).to.equal('foo');
      expect(convert({toLocaleString: () => 'foo', toString: () => 'bar'}, String)).to.equal('foo');
      expect(convert({}, String)).to.equal('object');
    });

    it('from tabris types', () => {
      expect(convert(percent, String)).to.equal('40');
      expect(convert(font, String)).to.equal('23px');
      expect(convert(constraint, String)).to.equal('#foo 0');
      expect(new LayoutData(JSON.parse(convert(layoutData, String))).equals(layoutData)).to.be.true;
      expect(convert(gradient, String)).to.equal('linear-gradient(180deg, rgb(0, 0, 0), rgb(1, 0, 0))');
      expect(convert(color, String)).to.equal('rgb(0, 1, 2)');
      expect(convert(image, String)).to.equal('image'); // TODO: Image currently has no toString implementation
    });

    it('from built-in types', () => {
      expect(convert(new String('foo'), String)).to.equal('foo');
      expect(convert(new Error('foo'), String)).to.equal('foo');
      expect(convert(new Date(100), String)).to.equal(new Date(100).toLocaleDateString());
    });

  });

  describe('to array', () => {

    it('from any primitive', () => {
      expect(convert('foo, bar', Array)).to.deep.equal(['foo', 'bar']);
      expect(convert(true, Array)).to.deep.equal([true]);
      expect(convert(23, Array)).to.deep.equal([23]);
    });

    it('from array-like', () => {
      expect(convert({length: 3, 0: 'foo', 1: 'bar'}, Array)).to.deep.equal(['foo', 'bar', undefined]);
    });

    it('from color', () => {
      expect(convert(color, Array)).to.deep.equal([0, 1, 2, 255]);
    });

    it('from enumerable object', () => {
      expect(convert({foo: 'bar'}, Array)).to.deep.equal(['bar']);
    });

    it('from invalid array-like', () => {
      expect(convert({length: Infinity}, Array).length).to.equal(1);
      expect(convert({length: -1}, Array).length).to.equal(1);
      expect(convert({length: 'foo'}, Array).length).to.equal(1);
      expect(convert({length: 2.3}, Array).length).to.equal(1);
    });

    it('from function', () => {
      expect(convert(() => 'foo', Array)).to.deep.equal(['foo']);
    });

    it('from array bufffer', () => {
      const arr = new Int8Array([0, 1, 2]);
      expect(convert(arr, Array)).to.deep.equal([0, 1, 2]);
      expect(convert(arr.buffer, Array)).to.deep.equal([0, 1, 2]);
    });

  });

  describe('to typed array', () => {

    it('from same type', () => {
      const arr = new Int16Array([2000]);
      expect(convert(arr, Int16Array)).to.equal(arr);
    });

    it('from other typed array', () => {
      const arr = new Int16Array([10, -10, 2000]);
      const result = convert(arr, Uint8Array);

      expect(result).to.be.instanceOf(Uint8Array);
      expect(result.buffer).to.equal(arr.buffer);
    });

    it('from buffer to typed array', () => {
      const arr = new Int16Array([10, -10, 2000]).buffer;
      const result = convert(arr, Int16Array);

      expect(result).to.be.instanceOf(Int16Array);
      expect(result.buffer).to.equal(arr);
    });

    it('from numbers array', () => {
      const result = convert([12], Uint8ClampedArray);
      expect(result).to.be.instanceOf(Uint8ClampedArray);
      expect(result.length).to.equal(1);
      expect(result[0]).to.equal(12);
    });

    it('from numbers array-like', () => {
      const result = convert({length: 1, 0: 12}, Uint8ClampedArray);
      expect(result).to.be.instanceOf(Uint8ClampedArray);
      expect(result.length).to.equal(1);
      expect(result[0]).to.equal(12);
    });

    it('from number-like array', () => {
      const result = convert([-1, false, true, '2', 3], Uint8ClampedArray);
      expect(result).to.be.instanceOf(Uint8ClampedArray);
      expect(Array.from(result)).to.deep.equal([0, 0, 1, 2, 3]);
    });

    it('from string', () => {
      // Can not be done until TextEncoder is public API
      expect(() => convert('foo', Float64Array)).to.throw(Error);
    });

  });

  describe('to ArrayBuffer', () => {

    it('from typed array to buffer', () => {
      const arr = new Int16Array([10, -10, 2000]);
      const result = convert(arr, ArrayBuffer);

      expect(result).to.be.instanceOf(ArrayBuffer);
      expect(result).to.equal(arr.buffer);
    });

    it('from numbers array', () => {
      const result = new Uint8Array(convert([12, -10, 1000], ArrayBuffer));
      expect(result.length).to.equal(3);
      expect(result[0]).to.equal(12);
      expect(result[1]).to.equal(0);
      expect(result[2]).to.equal(255);
    });

  });

  describe('to Blob', () => {

    it('from typed array', () => {
      const arr = new Int16Array([10, -10, 2000]);
      const result = convert(arr, ArrayBuffer);

      expect(result).to.be.instanceOf(ArrayBuffer);
      expect(result).to.equal(arr.buffer);
    });

    it('from string', () => {
      const arr = new Int16Array([10, -10, 2000]);
      const result = convert(arr, ArrayBuffer);

      expect(result).to.be.instanceOf(ArrayBuffer);
      expect(result).to.equal(arr.buffer);
    });

  });

  describe('to tabris type', () => {

    it('Percent', () => {
      expect(convert({percent: 40}, Percent).percent).to.equal(percent.percent);
      expect(convert('40%', Percent).percent).to.equal(percent.percent);
    });

    it('Color', () => {
      expect(convert('#000102', Color).equals(color)).to.be.true;
      expect(convert([0, 1, 2], Color).equals(color)).to.be.true;
    });

    it('Font', () => {
      expect(convert('23px', Font).equals(font)).to.be.true;
      expect(convert({size: 23}, Font).equals(font)).to.be.true;
    });

    it('Constraint', () => {
      expect(convert('#foo 0', Constraint).equals(constraint)).to.be.true;
      expect(convert({reference: '#foo'}, Constraint).equals(constraint)).to.be.true;
    });

    it('LayoutData', () => {
      expect(convert({width: 40}, LayoutData).equals(layoutData)).to.be.true;
    });

    it('LinearGradient', () => {
      expect(convert(
        'linear-gradient(180deg, rgb(0, 0, 0), rgb(1, 0, 0))',
        LinearGradient
      ).equals(gradient)).to.be.true;
    });

    it('Image', () => {
      expect(convert({src: 'foo.png'}, Image).equals(image)).to.be.true;
      expect(convert('foo.png', Image).equals(image)).to.be.true;
    });

  });

  describe('to any other object', () => {

    class TestType {
      value: any;
    }

    it('from subclass', () => {
      class Constructable extends TestType {
        constructor() { super(); }
      }

      const obj = new Constructable();

      expect(convert(obj, TestType)).to.equal(obj);
      expect(convert(obj, Constructable)).to.equal(obj);
    });

    it('throws for non-constructable', () => {
      expect(() => convert(12, TestType)).to.throw('Can not convert');
    });

    it('calls static from() if it has one parameter', () => {
      class StaticFactory extends TestType {
        static from(value) {return Object.assign(new StaticFactory(), {value});}
      }

      const result = convert(12, StaticFactory);

      expect(result).to.be.instanceOf(StaticFactory);
      expect(result.value).to.equal(12);
    });

    it('does not call static from() if it has noe parameter', () => {
      class StaticFactory extends TestType {
        static from() {throw new Error();}
        constructor(value) { super(); this.value = value; }
      }

      const result = convert(12, StaticFactory);

      expect(result).to.be.instanceOf(StaticFactory);
      expect(result.value).to.equal(12);
    });

    it('throws if from() returns other type', () => {
      class StaticFactory extends TestType {
        static from(value) {return {value};}
      }

      expect(() => convert(12, StaticFactory)).to.throw(Error);
    });

    it('calls static parse() for strings if available', () => {
      class StaticFactory extends TestType {
        static from(value) {}
        static parse(value: string) {
          return Object.assign(new StaticFactory(), {value: parseInt(value)});
        }
      }

      const result = convert('12', StaticFactory);
      expect(result).to.be.instanceOf(StaticFactory);
      expect(result.value).to.equal(12);
    });

    it('does not call static parse() for non-strings', () => {
      class StaticFactory extends TestType {
        static parse(value) {}
        static from(value: string) {
          return Object.assign(new StaticFactory(), {value: parseInt(value) + 1});
        }
      }

      const result = convert(12, StaticFactory);
      expect(result).to.be.instanceOf(StaticFactory);
      expect(result.value).to.equal(13);
    });

    it('throws if parse() returns other types', () => {
      class StaticFactory extends TestType {
        static parse(value) { return {value}; }
      }

      expect(() => convert('12', StaticFactory)).to.throw(Error);
    });

    it('calls constructor that takes at least one parameter', () => {
      class StaticFactory extends TestType {
        constructor(value: unknown, value2: unknown) {
          super();
          this.value = value;
        }

      }

      expect(convert('foo', StaticFactory).value).to.equal('foo');
    });

  });

});
