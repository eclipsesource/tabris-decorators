import { expect } from './test';
import { TypeGuards } from '../src';

describe('TypeGuards', () => {

  class TypeA {
    public str: string;
  }

  class TypeB {
    public str: string;
  }

  let typeGuards: TypeGuards;

  beforeEach(() => {
    typeGuards = new TypeGuards();
  });

  describe('checkType without guards', () => {

    it('checks primitives as positives', () => {
      expect(() => {
        typeGuards.checkType(0, Number);
        typeGuards.checkType('foo', String);
        typeGuards.checkType(true, Boolean);
      }).not.to.throw();
    });

    it('checks primitives against wrong primitives as negatives', () => {
      expect(() => typeGuards.checkType(0, String)).to.throw(
        'Expected value to be of type "string", but found "number".'
      );
      expect(() => typeGuards.checkType('', Boolean)).to.throw(
        'Expected value to be of type "boolean", but found "string".'
      );
      expect(() => typeGuards.checkType(true, Number)).to.throw(
        'Expected value to be of type "number", but found "boolean".'
      );
    });

    it('checks primitives against class types with negatives', () => {
      expect(() => typeGuards.checkType(0, TypeA)).to.throw(
        'Expected value to be of type "TypeA", but found "number".'
      );
      expect(() => typeGuards.checkType('', Date)).to.throw(
        'Expected value to be of type "Date", but found "string".'
      );
      expect(() => typeGuards.checkType(true, Array)).to.throw(
        'Expected value to be of type "Array", but found "boolean".'
      );
    });

    it('checks primitives against Object and null as positives', () => {
      expect(() => typeGuards.checkType(0, Object)).not.to.throw();
      expect(() => typeGuards.checkType('', null)).not.to.throw();
    });

    it('checks primitives against wrong primitives as negatives', () => {
      expect(() => typeGuards.checkType(0, String)).to.throw(
        'Expected value to be of type "string", but found "number".'
      );
      expect(() => typeGuards.checkType('', Boolean)).to.throw(
        'Expected value to be of type "boolean", but found "string".'
      );
      expect(() => typeGuards.checkType(true, Number)).to.throw(
        'Expected value to be of type "number", but found "boolean".'
      );
    });

    it('checks objects against class types as positives', () => {
      expect(() => {
        typeGuards.checkType(new TypeA(), TypeA);
        typeGuards.checkType(new Date(), Date);
        typeGuards.checkType([], Array);
      }).not.to.throw();
    });

    it('checks objects against class types as negatives', () => {
      expect(() => typeGuards.checkType(new TypeA(), TypeB)).to.throw(
        'Expected value to be of type "TypeB", but found "TypeA".'
      );
      expect(() => typeGuards.checkType(new Date(), Array)).to.throw(
        'Expected value to be of type "Array", but found "Date".'
      );
      expect(() => typeGuards.checkType([], TypeA)).to.throw(
        'Expected value to be of type "TypeA", but found "Array".'
      );
    });

    it('checks objects against super class types as positive', () => {
      class Date2 extends Date { }
      expect(() => typeGuards.checkType(new Date2(), Date)).not.to.throw();
    });

    it('checks objects against extending class types as negative', () => {
      class Date2 extends Date { }
      expect(() => typeGuards.checkType(new Date(), Date2)).to.throw(
        'Expected value to be of type "Date2", but found "Date".'
      );
    });

    it('checks objects against Object and null as positives', () => {
      expect(() => {
        typeGuards.checkType(new TypeA(), Object);
        typeGuards.checkType(new Date(), null);
      }).not.to.throw();
    });

  });

  describe('checkType with guards', () => {

    it('checks value that is instance of class compatible to registered class as positive', () => {
      typeGuards.add(TypeA, v => v instanceof TypeB);
      expect(() => typeGuards.checkType(new TypeB(), TypeA)).not.to.throw();
    });

    it('checks value that is instance of registered class as negative ', () => {
      typeGuards.add(TypeA, v => v && typeof v.str === 'string');
      expect(() => typeGuards.checkType(new TypeA(), TypeB)).to.throw();
    });

    it('checks value that is object literal compatible to registered class as positive', () => {
      typeGuards.add(TypeA, v => v && typeof v.str === 'string');
      expect(() => typeGuards.checkType({str: 'foo'}, TypeA)).not.to.throw();
    });

    it('checks value that is compatible to registered class as negative', () => {
      typeGuards.add(TypeA, v => v && typeof v.str === 'string');
      expect(() => typeGuards.checkType(new TypeB(), TypeA)).to.throw();
    });

    it('checks value against multiple type guards', () => {
      typeGuards.add(TypeA, v => v instanceof TypeB);
      typeGuards.add(TypeA, v => v && typeof v.str === 'string');
      typeGuards.add(TypeB, v => v && typeof v.str === 'string');
      typeGuards.add(TypeB, v => v instanceof TypeA);
      expect(() => typeGuards.checkType({str: 'foo'}, TypeA)).not.to.throw();
      expect(() => typeGuards.checkType({str: 'foo'}, TypeB)).not.to.throw();
      expect(() => typeGuards.checkType(new TypeA(), TypeB)).not.to.throw();
      expect(() => typeGuards.checkType(new TypeB(), TypeA)).not.to.throw();
    });

    it('treats guards that throw as returning false', () => {
      typeGuards.add(TypeA, v => { throw new Error(); });
      expect(() => typeGuards.checkType(new TypeB(), TypeA)).to.throw(
        'Expected value to be of type "TypeA", but found "TypeB".'
      );
    });

    it('continues to check after type guards that throw', () => {
      typeGuards.add(TypeA, v => { throw new Error(); });
      typeGuards.add(TypeA, v => v instanceof TypeB);
      typeGuards.add(TypeA, v => { throw new Error(); });
      expect(() => typeGuards.checkType(new TypeB(), TypeA)).not.to.throw();
    });

  });

});
