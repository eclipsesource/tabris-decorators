/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file ban-types no-construct*/
import 'mocha';
import 'sinon';
import {optional, required, initialize} from '../src';
import {restoreSandbox, expect} from './test';

describe('initialize', () => {

  afterEach(() => {
    restoreSandbox();
  });

  describe('with primitivs', () => {

    class MyPrimitiveData {
      public ignore: string;
      @required public readonly requiredReadOnly: string;
      @required public requiredNumber: number;
      @optional(true) public optionalBoolean: boolean;
    }

    it('sets all fields except undecorated', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, ignore: 'nope'};
      let target = new MyPrimitiveData();

      let result = initialize(target, source);

      expect(target).to.equal(result);
      expect(result.ignore).to.be.undefined;
      expect(result.requiredReadOnly).to.equal('foo');
      expect(result.requiredNumber).to.equal(23);
      expect(result.optionalBoolean).to.equal(false);
    });

    it('Manual initialization is not allowed', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, ignore: 'nope'};

      expect(() => Object.assign(new MyPrimitiveData(), source)).to.throw(
        'can only be set using the initialize function.'
      );
    });

    it('Post initialization changes are not allowed', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, ignore: 'nope'};
      let target = new MyPrimitiveData();
      let result = initialize(target, source);

      expect(() => result.optionalBoolean = true).to.throw(
        'Property "optionalBoolean" can only be set using the initialize function.'
      );
    });

    it('throws if already initialized', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, ignore: 'nope'};
      let target = new MyPrimitiveData();

      initialize(target, source);

      expect(() => initialize(target, source)).to.throw('Object can only be initialized once.');
    });

    it('Pre initialization access is not allowed', () => {
      expect(() => new MyPrimitiveData().optionalBoolean).to.throw(
        'Property "optionalBoolean" has not been initialized.'
      );
    });

    it('throws if required entry is missing', () => {
      let source: any = {requiredReadOnly: 'foo', optionalBoolean: false};

      expect(() => initialize(new MyPrimitiveData(), source)).to.throw(
        'Could not initialize required property "requiredNumber": Entry is missing in source object.'
      );
    });

    it('ignores if excess property exist on source', () => {
      let source: any = {requiredReadOnly: 'foo',  requiredNumber: 23, optionalBoolean: false, somethingElse: 'bar'};

      let result = initialize(new MyPrimitiveData(), source);

      expect((result as any).somethingElse).to.be.undefined;
    });

    it('throws if source not an object', () => {
      expect(() => initialize(new MyPrimitiveData(), 23)).to.throw(
        'Could not initialize object of type "MyPrimitiveData": Source is not a plain object.'
      );
    });

    it('throws if source not an object', () => {
      expect(() => initialize(new MyPrimitiveData(), new MyPrimitiveData())).to.throw(
        'Could not initialize object of type "MyPrimitiveData": Source is not a plain object.'
      );
    });

    it('throws in strict mode if excess property exist on source', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, somethingElse: 'bar'};

      expect(() => initialize(new MyPrimitiveData(), source, {strict: true})).to.throw(
          'Could not initialize object of type "MyPrimitiveData": '
        + 'Source property "somethingElse" does not exist on target or is not decorated.'
      );
    });

    it('property access fails after initialization fails', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, somethingElse: 'bar'};

      try {
        initialize(new MyPrimitiveData(), source, {strict: true});
      } catch (ex) {
        // expected
      }

      expect(() => new MyPrimitiveData().optionalBoolean).to.throw(
        'Property "optionalBoolean" has not been initialized.'
      );
    });

    it('throws if required entry has wrong type', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 'NaN', optionalBoolean: false};

      expect(() => initialize(new MyPrimitiveData(), source)).to.throw(
           'Could not initialize required property "requiredNumber": '
         + 'Expected value to be of type "number", but found "string".'
      );
    });

    it('throws if optional entry has wrong type', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: 'bar'};

      expect(() => initialize(new MyPrimitiveData(), source)).to.throw(
           'Could not initialize optional property "optionalBoolean": '
         + 'Expected value to be of type "boolean", but found "string".'
      );
    });

    it('throws if initialization after failed initialization is attempted', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, optionalBoolean: false, ignore: 'nope'};
      let incompleteSource: any = {requiredReadOnly: 'foo', optionalBoolean: false};
      let target = new MyPrimitiveData();

      try {
        initialize(target, incompleteSource);
      } catch (ex) {
        // expected
      }

      expect(() => initialize(target, source)).to.throw('Object can only be initialized once.');
    });

    it('sets fallback value if optional value is missing', () => {
      let source: any = {requiredReadOnly: 'foo', requiredNumber: 23, ignore: 'nope'};

      expect(initialize(new MyPrimitiveData(), source).optionalBoolean).to.be.true;
    });

    it('checks required value type on decoration', () => {
      expect(() => {
        class MyPrimitiveData2 {
          @required public whatTypeIsThis: boolean | null;
        }
      }).to.throw(
          'Could not apply decorator "required" to property "whatTypeIsThis": '
        + 'Property type could not be inferred. Only classes and primitive types are supported.'
      );
    });

  });

  describe('deep', () => {

    class Model1 {
      constructor(readonly foo: string) {}
    }

    class Model2 {
      @required public m1: Model1;
      @optional('str') public str: string;
      constructor(source: any = {}, deep: boolean = true) {
        initialize(this, source, {deep});
      }
    }

    class Model3 {
      @optional('foo') public m1: Model1;
      @optional({m1: 'bar'}) public m2: Model2;
      constructor(source: any = {}, deep: boolean = true) {
        initialize(this, source, {deep});
      }
    }

    it ('always accepts pre-created instances', () => {
      let source = {m1: new Model1('foo')};

      expect(new Model2(source, false).m1).to.equal(source.m1);
      expect(new Model2(source, true).m1).to.equal(source.m1);
    });

    it ('fails for other types in non-deep mode', () => {
      expect(() => new Model2({m1: 'foo'}, false)).to.throw(
        'Expected value to be of type "Model1", but found "string".'
      );
    });

    it ('fails for other fallback types in non-deep mode', () => {
      expect(() => new Model3({m2: new Model1('foo')}, false)).to.throw(
        'Expected value to be of type "Model1", but found "string".'
      );
    });

    it ('creates instances using parameters', () => {
      let m2 = new Model2({m1: 'foo'});

      expect(m2.m1).to.be.instanceOf(Model1);
      expect(m2.m1.foo).to.equal('foo');
    });

    it ('creates instances using fallback parameters', () => {
      let m3 = new Model3();

      expect(m3.m1.foo).to.equal('foo');
      expect(m3.m2.m1.foo).to.equal('bar');
    });

    it ('still fails for mis-matching primitives', () => {
      let source = {m1: new Model1('foo'), str: true};

      expect(() => new Model2(source)).to.throw(
        'Could not initialize optional property "str": Expected value to be of type "string", but found "boolean".'
      );
    });

    it ('still fails for primitive target types', () => {
      let source = {m1: new Model1('foo'), str: new Model1('foo')};

      expect(() => new Model2(source)).to.throw(
        'Could not initialize optional property "str": Expected value to be of type "string", but found "Model1".'
      );
    });

  });

  describe('with processors', () => {

    function toString(value: any) {
      return value + '';
    }

    function toNumber(value: any) {
      return parseInt(value, 10);
    }

    function checkAllUpperCase(str: string) {
      if (str.toUpperCase() !== str) {
        throw new Error(str + ' is not all upper case');
      }
      return str;
    }

    function nop(value: any) {
      return value;
    }

    class MyPrimitiveData {
      @required(checkAllUpperCase) public requiredString: string;
      @required(toNumber) public requiredNumber: number;
      @optional(true, toString) public optionalBoolean: string;
      @optional(25, nop) public optionalNumber: number;
    }

    it('converts given values', () => {
      let source: any = {requiredString: 'FOO', requiredNumber: '23'};

      let result = initialize(new MyPrimitiveData(), source);

      expect(result.optionalBoolean).to.equal('true');
      expect(result.requiredNumber).to.equal(23);
      expect(result.requiredString).to.equal('FOO');
    });

    it('checks given values', () => {
      let source: any = {requiredString: 'foo', requiredNumber: '23'};

      expect(() => initialize(new MyPrimitiveData(), source)).to.throw(
        'foo is not all upper case'
      );
    });

    it('checks processed values', () => {
      let source: any = {requiredString: 'FOO', requiredNumber: '23', optionalNumber: true};

      expect(() => initialize(new MyPrimitiveData(), source)).to.throw(
          'Could not initialize optional property "optionalNumber": '
        + 'Expected value to be of type "number", but found "boolean".'
      );
    });

    describe('and deep', () => {

      class Model1 {
        constructor(readonly foo: string) {}
      }

      class Model2 {
        @optional(23, toString) public model: Model1;
      }

      it('uses given converted value for deep initialization', () => {
        let model2 = initialize(new Model2(), { model: 22}, {deep: true});

        expect(model2.model.foo).to.equal('22');
      });

      it('uses given default value for deep initialization', () => {
        let model2 = initialize(new Model2(), {}, {deep: true});

        expect(model2.model.foo).to.equal('23');
      });

    });

  });

});
