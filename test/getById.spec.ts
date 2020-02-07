import 'mocha';
import {useFakeTimers} from 'sinon';
import {Button, Composite, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy} from './test';
import {component, getById} from '../src';

describe('getById', () => {

  beforeEach(() => {
    tabris._init(new ClientMock());
  });

  afterEach(() => {
    restoreSandbox();
  });

  @component class CustomComponent extends Composite {

    @getById
    readonly button1: Button;

    @getById(v => v instanceof Button || v.class === 'button')
    readonly button2: Button;

    @getById
    readonly composite1: Composite;

  }

  let widget: CustomComponent;
  let button1: Button;
  let button2: Button;
  let composite1: Composite;

  beforeEach(() => {
    widget = new CustomComponent();
    button1 = new Button({id: 'button1'});
    button2 = new Button({id: 'button2', class: 'button'});
    composite1 = new Composite({id: 'composite1'});
  });

  it('returns widget by type and id', () => {
    widget.append(composite1, button1, button2);

    expect(widget.button1).to.equal(button1);
    expect(widget.composite1).to.equal(composite1);
  });

  it('caches after append', () => {
    widget.append(composite1, button1, button2);
    const button1_2 = new Button({id: 'button1'});
    button1.dispose();
    widget.append(button1_2);

    expect(widget.button1).to.equal(button1);
    expect(widget.button1).not.to.equal(button1_2);
  });

  it('fails to decorate unknown type', () => {
    expect(() => {
      @component class FailedComponent extends Composite {
        @getById readonly button1: Button | null | Composite;
      }
    }).to.throw(
      Error,
      'Could not apply decorator "getById" to "button1": '
      + 'Property button1 can not be resolved without a type guard.'
    );
  });

  describe('on a Widget that is not a @component', () => {

    let clock;
    let now;

    beforeEach(() => {
      now = Date.now();
      clock = useFakeTimers(now);
    });

    afterEach(() => {
      clock.restore();
    });

    it('prints an error', () => {
      spy(console, 'error');
      class FailedComponent extends Composite {
        @getById readonly button1: Button;
      }
      clock.tick(now + 100);
      expect(console.error).to.have.been.calledWith(
        'Decorator "getById" could not resolve property "button1": FailedComponent is not a @component'
      );
    });

    it('throws on access', () => {
      class FailedComponent extends Composite {

        @getById readonly button1: Button;

        constructor() {
          super({});
          this.append(new Button({id: 'button1'}));
        }

      }
      expect(() => new FailedComponent().button1).to.throw(
        'Decorator "getById" could not resolve property "button1": FailedComponent is not a @component'
      );
    });

  });

  it('throws if a getter is accessed before first append', () => {
    expect(() => widget.button1).to.throw(
      'Decorator "getById" could not resolve property "button1": No widgets have been appended yet.'
    );
  });

  it('throws if a getter can not be resolved after first append', () => {
    expect(() => widget.append(composite1, button2, new Button({id: 'button3'}))).to.throw(
      'Decorator "getById" could not resolve property "button1": No widget with id "button1" appended.'
    );
  });

  it('throws if getters finds wrong type after first append', () => {
    expect(() => widget.append(composite1, button2, new Composite({id: 'button1'}))).to.throw(
      'Decorator "getById" could not resolve property "button1": '
      + 'Expected value to be of type Button, but found Composite'
    );
  });

  it('reject value when typeGuard rejects', () => {
    const notReallyAButton = new Composite({id: 'button1'});

    expect(() => {
      widget.append(composite1, button1, notReallyAButton);
    }).to.throw(
      'Decorator "getById" could not resolve property "button1": More than one widget with id "button1" appended.'
    );
  });

  it('accepts incompatible types when typeGuard allows it', () => {
    const notReallyAButton = new Composite({id: 'button2', class: 'button'});

    widget.append(composite1, button1, notReallyAButton);

    expect(widget.button2).to.equal(notReallyAButton);
  });

  it('throws if getters finds multiple matches', () => {
    expect(() => widget.append(composite1, button1, new Button({id: 'button1'}))).to.throw(
      'Decorator "getById" could not resolve property "button1": More than one widget with id "button1" appended.'
    );
  });

});
