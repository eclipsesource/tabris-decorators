import 'mocha';
import 'sinon';
import 'tabris';
import {expect} from './test';
import {checkType} from '../src';

describe('checkType', () => {

  it('checks primitives positive', () => {
    expect(() => {
      checkType(-1, Number);
      checkType(0, Number);
      checkType(1, Number);
      checkType(-Infinity, Number);
      checkType(Infinity, Number);
      checkType(NaN, Number);
      checkType(true, Boolean);
      checkType(false, Boolean);
      checkType('', String);
      checkType('foo', String);
    }).not.to.throw();
  });

  it('checks primitives negative', () => {
    expect(() => checkType('', Number)).
      to.throw('Expected value [empty string] to be of type number, but found string');
    expect(() => checkType('foo', Boolean)).
      to.throw('Expected value "foo" to be of type boolean, but found string');
    expect(() => checkType(23, Boolean)).
      to.throw('Expected value "23" to be of type boolean, but found number');
    expect(() => checkType(false, String)).
      to.throw('Expected value "false" to be of type string, but found boolean');
    expect(() => checkType(false, Date)).
      to.throw('Expected value "false" to be of type Date, but found boolean');
  });

  it('checks objects positive', () => {
    expect(() => {
      checkType([], Array);
      checkType({}, Object);
      checkType(new Date(), Date);
      checkType(() => null, Function);
      checkType(class {}, Function);
      // eslint-disable-next-line prefer-arrow-callback
      checkType(function() { }, Function);
    }).not.to.throw();
  });

  it('checks objects negative', () => {
    expect(() => checkType({}, Array)).to.throw('Expected value to be of type Array, but found Object.');
    expect(() => checkType(new Date(), Function)).to.throw('Expected value to be of type Function, but found Date.');
  });

  it('passes any value when type is Object', () => {
    expect(() => checkType(-1, Object)).not.to.throw();
    expect(() => checkType('foo', Object)).not.to.throw();
    expect(() => checkType(new Date(), Object)).not.to.throw();
  });

  it('null and undefined always pass', () => {
    expect(() => {
      checkType(null, Number);
      checkType(undefined, Number);
      checkType(null, String);
      checkType(undefined, String);
      checkType(null, Boolean);
      checkType(undefined, Boolean);
      checkType(null, Function);
      checkType(undefined, Function);
      checkType(null, Object);
      checkType(undefined, Object);
      checkType(null, Date);
      checkType(undefined, Date);
    }).not.to.throw();
  });

  it('boxed types never pass', () => {
    expect(() => checkType(new Number(23), Number)).to.throw('Boxed values are forbidden');
    expect(() => checkType(new String('foo'), String)).to.throw('Boxed values are forbidden');
    expect(() => checkType(new Boolean(true), Boolean)).to.throw('Boxed values are forbidden');
  });

});
