import 'mocha';
import 'sinon';
import {Composite, Properties, tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, restoreSandbox, spy} from './test';
import {component, injector} from '../src';
const orgComponentKey: unique symbol = tabris.symbols.originalComponent as any;

class OriginalCustomComponent extends Composite {

  constructor(properties: Properties<Composite>) {
    super(properties);
    this.append(Composite());
  }

}

const CustomComponent = component({factory: true})(OriginalCustomComponent);
type CustomComponent = OriginalCustomComponent;

describe('component({factory: true})', () => {

  let widget: CustomComponent;
  let parent: Composite;

  beforeEach(() => {
    tabris._init(new ClientMock());
    parent = new Composite();
    widget = new CustomComponent({});
    parent.append(widget);
  });

  afterEach(() => {
    restoreSandbox();
  });

  beforeEach(function() {
    spy(injector.jsxProcessor, 'createCustomComponent');
  });

  it('is factory for given type', function() {
    expect(CustomComponent()).to.be.instanceOf(CustomComponent);
    expect(CustomComponent()).to.be.instanceOf(OriginalCustomComponent);
  });

  it('isolates', function() {
    expect(CustomComponent().children().length).to.equal(0);
  });

  it('calls createElement', function() {
    const attr = {top: 23};

    CustomComponent(attr);

    expect(injector.jsxProcessor.createCustomComponent).to.have.been.calledOnce;
    expect(injector.jsxProcessor.createCustomComponent).to.have.been.calledWith(OriginalCustomComponent, attr);
  });

  it('does not double-wrap', function() {
    const Component2 = component(CustomComponent);
    expect(Component2[orgComponentKey]).to.equal(OriginalCustomComponent);
    expect(Component2[orgComponentKey]).not.to.equal(CustomComponent);
  });

});
