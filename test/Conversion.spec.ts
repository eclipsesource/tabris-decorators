import 'mocha';
import 'sinon';
import {useFakeTimers, SinonSpy} from 'sinon';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy, stub} from './test';
import {Conversion} from '../src/internals/Conversion';
import {BindingConverter} from '../src';

describe('Conversion', () => {

  class Target {
    propA: string = '';
    prop0: number = 0;
  }

  class NonTarget {
    propA: string = '';
    prop0: number = 0;
  }

  const proto = Target.prototype;
  const name = 'propA';
  const value = 'foo';
  const fallback = 'bar';

  let convert: BindingConverter<any, Target> & SinonSpy;

  beforeEach(() => {
    convert = spy();
  });

  afterEach(() => {
    restoreSandbox();
  });

  describe('convert', () => {

    it('returns value without converter', () => {
      expect(Conversion.convert({
        proto, name, value
      })).to.equal('foo');
    });

    it('returns fallback for undefined', () => {
      expect(Conversion.convert({
        proto, name, fallback,
        value: undefined
      })).to.equal('bar');
    });

    it('calls converter with given value', () => {
      Conversion.convert({
        proto, name, value, convert
      });

      expect(convert).to.have.been.calledOnceWith('foo');
    });

    it('returns converter return value', () => {
      expect(Conversion.convert({
        proto, name, value,
        convert: v => 'x_' + v
      })).to.equal('x_foo');
    });

    it('does not convert undefined', () => {
      const result = Conversion.convert({
        proto, name, convert,
        value: undefined
      });

      expect(result).to.equal(undefined);
      expect(convert).not.to.have.been.called;
    });

    it('calls converter with conversion instance', () => {
      Conversion.convert({
        proto, name, convert, value
      });

      expect(convert.args[0][1]).to.be.instanceOf(Conversion);
    });

  });

  describe('instance', () => {

    it('sets conversion instance properties', () => new Promise(resolve => {
      Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          expect(conversion.proto).to.equal(Target.prototype);
          expect(conversion.name).to.equal('propA');
          resolve();
        }
      });
    }));

    it('targets() returns false for non-matching arguments', () => new Promise(resolve => {
      Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          expect(conversion.targets(NonTarget, 'propA')).to.be.false;
          expect(conversion.targets(NonTarget)).to.be.false;
          expect(conversion.targets(Target, 'prop0')).to.be.false;
          resolve();
        }
      });
    }));

    it('targets() returns true for matching target and property', () => new Promise(resolve => {
      try {
        Conversion.convert({
          proto, name, value,
          convert: (_, conversion) => {
            expect(conversion.targets(Target, 'propA')).to.be.true;
            resolve();
          }
        });
      } catch {
        // ignore for now
      }
    }));

    it('targets() returns true for matching target', () => new Promise(resolve => {
      try {
        Conversion.convert({
          proto, name, value,
          convert: (_, conversion) => {
            expect(conversion.targets(Target)).to.be.true;
            resolve();
          }
        });
      } catch {
        // ignore for now
      }
    }));

    it('targets() may not be called after returning true', () => new Promise(resolve => {
      Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          conversion.targets(Target, 'propA');
          expect(() => conversion.targets(Target, 'propA')).to.throw(
            Error,
            'targets() may not be called again'
          );
          resolve();
        }
      });
    }));

    it('resolve() can be called with matching type', () => new Promise(resolve => {
      Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          if (conversion.targets(Target, 'propA')) {
            conversion.resolve('baz');
            resolve();
          }
        }
      });
    }));

    it('resolve() can not be called twice', () => new Promise((resolve, reject) => {
      Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          if (conversion.targets(Target, 'propA')) {
            conversion.resolve('baz');
            expect(() => conversion.resolve('baz')).to.throw(Error, 'resolve was already called');
            resolve();
          }
        }
      });
    }));

    it('resolve() can not be combined with return value', () => {
      expect(() =>
        Conversion.convert({
          proto, name, value,
          convert: (_, conversion) => {
            if (conversion.targets(Target, 'propA')) {
              conversion.resolve(undefined);
              return 'baz';
            }
          }
        })
      ).to.throw(Error, 'Converter may not return a value after resolve was called');
    });

    it('resolve() must be called if targets() returns true', () => {
      expect(() =>
        Conversion.convert({
          proto, name, value,
          convert: (_, conversion) => {
            conversion.targets(Target, 'propA');
          }
        })
      ).to.throw(Error, 'resolve() must be called if targets() returns true');
    });

    it('resolve() value is returned', () => {
      expect(Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          if (conversion.targets(Target, 'propA')) {
            return conversion.resolve('baz');
          }
        }
      })).to.equal('baz');
    });

    it('can be destructured', () => {
      expect(Conversion.convert<any>({
        proto, name, value,
        convert: (_, {targets, resolve}) => {
          if (targets(Target, 'propA')) {
            return resolve('baz');
          }
        }
      })).to.equal('baz');
    });

    it('resolve() may not be called if targets() returns false', () => {
      expect(Conversion.convert({
        proto, name, value,
        convert: (_, conversion) => {
          conversion.targets(Target, 'prop0');
          return 'baz';
        }
      })).to.equal('baz');
    });

  });

});
