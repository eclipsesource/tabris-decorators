import 'mocha';
import 'sinon';
import {ChangeListeners, Composite, Properties, tabris, TextInput} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, stub, spy, restoreSandbox} from './test';
import {bind, bindAll, component, event, property, inject, injector} from '../src';

class Item {

  /** @type {ChangeListeners<Item, 'text'>} */
  @event onTextChanged;

  /** @type {string} */
  @property({type: String})
  text = 'Hello';

}

@component
class CustomComponent extends Composite {

  /** @type {Item} */
  @bind({type: Item, all: {
    text: '#foo.text'
  }})
  item;

  /** @param {Properties<CustomComponent>} properties */
  constructor(properties) {
    super(properties);
  }

}

@component
class UncheckedCustomComponent extends Composite {

  /** @type {Item} */
  @bind({all: {
    text: '#foo.text'
  }})
  item;

  /** @param {Properties<CustomComponent>} properties */
  constructor(properties) {
    super(properties);
  }

}

@component
class BindAllCustomComponent extends Composite {

  /** @type {Item} */
  @bindAll({
    text: '#foo.text'
  })
  item;

}

class UncheckedTargetComponent extends Composite {
  @property text;
}

describe('component', () => {

  /** @type {Item} */
  let item;

  /** @type {TextInput} */
  let textInput;

  beforeEach(() => {
    injector.jsxProcessor.unsafeBindings = 'error';
    tabris._init(new ClientMock());
    item = new Item();
  });

  afterEach(() => {
    restoreSandbox();
    injector.jsxProcessor.unsafeBindings = 'error';
  });

  describe('@bind({type, all})', () => {

    /** @type {CustomComponent} */
    let widget;

    beforeEach(() => {
      tabris._init(new ClientMock());
      widget = new CustomComponent();
      item = new Item();
      textInput = new TextInput({id: 'foo'});
    });

    it('fails to decorate primitive', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {length: '#bar.foo'}, type: Number})
          item;
        }
      }).to.throw(Error, 'Property type needs to extend Object');
    });

    it('fails to decorate with missing paths', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {}, type: Item})
          item;
        }
      }).to.throw(Error, 'Missing binding path(s)');
    });

    it('fails to decorate with invalid path', () => {
      expect(() => {class Test extends Composite {
        @bind({all: {text: 'foo'}, type: Item})
        item;
      }}).to.throw(Error,
        'Could not apply decorator "bind" to "item": Binding path must start with direction or selector.'
      );
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo.bar.baz'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path has too many segments.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo[bar]'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: ' #foo.bar'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
    });

    it('support set via constructor', () => {
      widget = new CustomComponent({item});
      expect(widget.item).to.equal(item);
    });

    it('support set via set method', () => {
      widget.set({item});
      expect(widget.item).to.equal(item);
    });

    it('rejects if explicit type does not match', () => {
      expect(() => widget.set({item: new Date()})).to.throw(
        'Failed to set property "item" of class CustomComponent: '
        + 'Expected value to be of type Item, but found Date.'
      );
    });

    it('fires change event on widget', () => {
      const listener = stub();
      widget.on({itemChanged: listener});

      widget.item = item;

      expect(listener).to.have.been.calledWithMatch({
        target: widget, value: item, type: 'itemChanged'
      });
    });

    it('applies current item property value to target property on append', () => {
      widget.item = item;

      widget.append(textInput);

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies new item property value to target property', () => {
      widget.append(textInput);
      widget.item = item;

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies changed item property value to target property', () => {
      widget.item = item;
      widget.append(textInput);

      item.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('applies current target property value to undefined item property on append', () => {
      item.text = undefined;
      textInput.text = 'World';
      widget.item = item;

      widget.append(textInput);

      expect(item.text).to.equal('World');
      expect(textInput.text).to.equal('World');
    });

    it('applies changed target property value to item property', () => {
      widget.item = item;
      widget.append(textInput);

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('applies changed target property value to item property', () => {
      widget.item = item;
      widget.append(textInput);

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('ignores changed target property value after item is nulled', () => {
      widget.item = item;
      widget.append(textInput);
      widget.item = null;

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('Hello');
    });

    it('ignores target property changes during item property change', () => {
      widget.item = item;
      widget.append(textInput);
      textInput.onTextChanged(({value}) => {
        if (value !== 'other') {
          textInput.text = 'other';
        }
      });

      item.text = 'World';

      expect(textInput.text).to.equal('other');
      expect(item.text).to.equal('World');
    });

    it('propagates target property error', () => {
      widget.item = item;
      widget.append(textInput);
      textInput.onTextChanged(({value}) => {
        throw new Error('foo');
      });

      expect(() => {
        textInput.text = 'World';
      }).to.throw(Error, 'foo');
    });

    it('propagates source property error', () => {
      widget.item = item;
      widget.append(textInput);
      widget.item.onTextChanged(({value}) => {
        throw new Error('foo');
      });

      expect(() => {
        item.text = 'World';
      }).to.throw(Error, 'foo');
    });

    it('applies item property changes during target property change', () => {
      widget.item = item;
      widget.append(textInput);
      item.onTextChanged(({value}) => {
        if (value === 'World') {
          item.text = 'other';
        }
      });

      textInput.text = 'World';

      expect(textInput.text).to.equal('other');
      expect(item.text).to.equal('other');
    });

    it('ignores item nulled during item target property change', () => {
      widget.item = item;
      widget.append(textInput);
      item.onTextChanged(({value}) => {
        widget.item = null;
        item.text = 'foo';
      });

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('foo');
    });

    it('restores original value on item nulled', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item = null;

      expect(item.text).to.equal('Hello');
      expect(textInput.text).to.equal('World');
    });

    it('restores original value on item undefined', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item = undefined;

      expect(item.text).to.equal('Hello');
      expect(textInput.text).to.equal('World');
    });

    it('restores original target value on source property undefined', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item.text = undefined;

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('sets target value to null when source property is null', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item.text = null;

      expect(item.text).to.equal(null);
      expect(textInput.text).to.equal(''); // textInput behavior on setting null
    });

    it('fails on append if target is missing', () => {
      expect(() => {
        widget.append(new Composite());
      }).to.throw(Error, 'No widget matching "#foo" was appended.');
    });

    it('fails on append if target property is missing', () => {
      expect(() => {
        widget.append(new Composite({id: 'foo'}));
      }).to.throw(Error,
        'Binding "item.text" <-> "#foo.text" failed: Composite does not have a property "text".'
      );
    });

    it('fails on append if target property has no setter', () => {
      const target = new Composite({id: 'foo'});
      target.text = 'foo';
      expect(() => {
        widget.append(target);
      }).to.throw(Error,
        'Composite property "text" has no setter, missing @prop / @property?'
      );
    });

    it('fails on append if target property is marked unchecked', () => {
      expect(() => {
        widget.append(new UncheckedTargetComponent({id: 'foo'}));
      }).to.throw(
        Error,
        'Error in binding "item.text" <-> "#foo.text": Right hand property '
        + '"text" requires an explicit type check.'
      );
    });

    it('fails setting item when source property does not exist', () => {
      class ItemB {
        /** @type {string} */
        text;
      }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object ItemB does not have a property "text".'
      );
    });

    it('fails setting item when source property has no setter', () => {
      class ItemB { text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'ItemB property "text" has no setter, missing @prop / @property?'
      );
    });

    it('fails setting item in strict mode when source property is unchecked', () => {
      class ItemB { @property text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object property "text" requires an explicit type check.'
      );
    });

    it('accepts item in non-strict mode when source property is unchecked', () => {
      injector.jsxProcessor.unsafeBindings = 'warn';
      class ItemB { @property text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).not.to.throw();
    });

  });

  describe('@bind({all})', () => {

    /** @type {UncheckedCustomComponent} */
    let widget;

    beforeEach(() => {
      tabris._init(new ClientMock());
      widget = new UncheckedCustomComponent();
      item = new Item();
      textInput = new TextInput({id: 'foo'});
    });

    it('fails to decorate primitive', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {length: '#bar.foo'}, type: Number})
          item;
        }
      }).to.throw(Error, 'Property type needs to extend Object');
    });

    it('fails to decorate with missing paths', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {}, type: Item})
          item;
        }
      }).to.throw(Error, 'Missing binding path(s)');
    });

    it('fails to decorate with invalid path', () => {
      expect(() => {class Test extends Composite {
        @bind({all: {text: 'foo'}, type: Item})
        item;
      }}).to.throw(Error,
        'Could not apply decorator "bind" to "item": Binding path must start with direction or selector.'
      );
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo.bar.baz'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path has too many segments.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo[bar]'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: ' #foo.bar'}, type: Item})
        item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
    });

    it('support set via constructor', () => {
      widget = new CustomComponent({item});
      expect(widget.item).to.equal(item);
    });

    it('support set via set method', () => {
      widget.set({item});
      expect(widget.item).to.equal(item);
    });

    it('fires change event on widget', () => {
      const listener = stub();
      widget.on({itemChanged: listener});

      widget.item = item;

      expect(listener).to.have.been.calledWithMatch({
        target: widget, value: item, type: 'itemChanged'
      });
    });

    it('applies current item property value to target property on append', () => {
      widget.item = item;

      widget.append(textInput);

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies new item property value to target property', () => {
      widget.append(textInput);
      widget.item = item;

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies changed item property value to target property', () => {
      widget.item = item;
      widget.append(textInput);

      item.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('applies current target property value to undefined item property on append', () => {
      item.text = undefined;
      textInput.text = 'World';
      widget.item = item;

      widget.append(textInput);

      expect(item.text).to.equal('World');
      expect(textInput.text).to.equal('World');
    });

    it('applies changed target property value to item property', () => {
      widget.item = item;
      widget.append(textInput);

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('applies changed target property value to item property', () => {
      widget.item = item;
      widget.append(textInput);

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('ignores changed target property value after item is nulled', () => {
      widget.item = item;
      widget.append(textInput);
      widget.item = null;

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('Hello');
    });

    it('ignores target property changes during item property change', () => {
      widget.item = item;
      widget.append(textInput);
      textInput.onTextChanged(({value}) => {
        if (value !== 'other') {
          textInput.text = 'other';
        }
      });

      item.text = 'World';

      expect(textInput.text).to.equal('other');
      expect(item.text).to.equal('World');
    });

    it('propagates target property error', () => {
      widget.item = item;
      widget.append(textInput);
      textInput.onTextChanged(({value}) => {
        throw new Error('foo');
      });

      expect(() => {
        textInput.text = 'World';
      }).to.throw(Error, 'foo');
    });

    it('propagates source property error', () => {
      widget.item = item;
      widget.append(textInput);
      widget.item.onTextChanged(({value}) => {
        throw new Error('foo');
      });

      expect(() => {
        item.text = 'World';
      }).to.throw(Error, 'foo');
    });

    it('applies item property changes during target property change', () => {
      widget.item = item;
      widget.append(textInput);
      item.onTextChanged(({value}) => {
        if (value === 'World') {
          item.text = 'other';
        }
      });

      textInput.text = 'World';

      expect(textInput.text).to.equal('other');
      expect(item.text).to.equal('other');
    });

    it('ignores item nulled during item target property change', () => {
      widget.item = item;
      widget.append(textInput);
      item.onTextChanged(({value}) => {
        widget.item = null;
        item.text = 'foo';
      });

      textInput.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('foo');
    });

    it('restores original value on item nulled', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item = null;

      expect(item.text).to.equal('Hello');
      expect(textInput.text).to.equal('World');
    });

    it('restores original value on item undefined', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item = undefined;

      expect(item.text).to.equal('Hello');
      expect(textInput.text).to.equal('World');
    });

    it('restores original target value on source property undefined', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item.text = undefined;

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

    it('sets target value to null when source property is null', () => {
      widget.item = item;
      textInput.text = 'World';
      widget.append(textInput);

      widget.item.text = null;

      expect(item.text).to.equal(null);
      expect(textInput.text).to.equal(''); // textInput behavior on setting null
    });

    it('fails on append if target is missing', () => {
      expect(() => {
        widget.append(new Composite());
      }).to.throw(Error, 'No widget matching "#foo" was appended.');
    });

    it('fails on append if target property is missing', () => {
      expect(() => {
        widget.append(new Composite({id: 'foo'}));
      }).to.throw(
        Error,
        'Binding "item.text" <-> "#foo.text" failed: '
        + 'Composite does not have a property "text".'
      );
    });

    it('fails on append if target property has no setter', () => {
      const target = new Composite({id: 'foo'});
      target.text = 'foo';
      expect(() => {
        widget.append(target);
      }).to.throw(
        Error,
        'Composite property "text" has no setter, missing @prop / @property?'
      );
    });

    it('fails on append in strict mode if target property is marked unchecked', () => {
      expect(() => {
        widget.append(new UncheckedTargetComponent({id: 'foo'}));
      }).to.throw(
        Error,
        'Error in binding "item.text" <-> "#foo.text": '
        + 'Right hand property "text" requires an explicit type check.'
      );
    });

    it('succeeds with warning on append in non-strict mode if target widget property is marked unchecked', () => {
      injector.jsxProcessor.unsafeBindings = 'warn';
      spy(console, 'warn');
      widget.append(new UncheckedTargetComponent({id: 'foo'}));
      expect(console.warn).to.have.been.calledWith(
        'Unsafe binding "item.text" <-> "#foo.text": '
        + 'Right hand property "text" has no type check.'
      );
    });

    it('fails setting item when source property does not exist', () => {
      class ItemB {
        /** @type {string} */
        text;
      }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object ItemB does not have a property "text".'
      );
    });

    it('fails setting item when source property has no setter', () => {
      class ItemB { text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'ItemB property "text" has no setter, missing @prop / @property?');
    });

    it('fails setting item when source property is marked unchecked (emitDecoratorMetadata: true)', () => {
      class ItemB { @property text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object property "text" requires an explicit type check.'
      );
    });

    it('fails setting item when source property is marked unchecked (emitDecoratorMetadata: true)', () => {
      class ItemB { @property text = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object property "text" requires an explicit type check.'
      );
    });

    it('fails setting item when source property is marked unchecked (emitDecoratorMetadata: false)', () => {
      class ItemB { }
      property(ItemB.prototype, 'text');
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(
        Error,
        'Failed to set property "item" of class CustomComponentB: '
        + 'Object property "text" requires an explicit type check.'
      );
    });

    it('warns in non-strict mode when source property is marked unchecked (emitDecoratorMetadata: false)', () => {
      injector.jsxProcessor.unsafeBindings = 'warn';
      spy(console, 'warn');
      class ItemB { }
      property(ItemB.prototype, 'text');
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item;
      }

      new CustomComponentB().item = new ItemB();

      expect(console.warn).to.have.been.calledOnce;
    });

  });

  describe('@bind({all, typeGuard})', () => {

    @component class ComponentWithTypeGuard extends Composite {
      @bind({
        all: {text: '#foo.bar'},
        typeGuard: v => (typeof v.text === 'string') || v === undefined
      })
      /** @type {{text: string}} */
      value;
    }

    class PlainItem {
      /**
       * @private
       * @type {string}
       **/
      _str;
      set text(str) {
        this._str = str;
      }
      get text() {
        return this._str;
      }
    }

    it('throws if own value is rejected by type guard', () => {
      const value = new PlainItem();
      value.text = 23;
      expect(() => (new ComponentWithTypeGuard()).value = value).to.throw(
        'Failed to set property "value" of class ComponentWithTypeGuard: '
        + 'Type guard check failed'
      );
    });

    it('succeeds if own value is accepted by type guard', () => {
      const value = new PlainItem();
      value.text = '23';
      const guarded = new ComponentWithTypeGuard();

      guarded.value = value;

      expect(guarded.value.text).to.equal('23');
    });

  });

  describe('@bindAll(bindings)', () => {

    /** @type {BindAllCustomComponent} */
    let widget;

    beforeEach(() => {
      tabris._init(new ClientMock());
      widget = new BindAllCustomComponent();
      item = new Item();
      textInput = new TextInput({id: 'foo'});
    });

    it('applies current item property value to target property on append', () => {
      widget.item = item;

      widget.append(textInput);

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies new item property value to target property', () => {
      widget.append(textInput);
      widget.item = item;

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('applies changed item property value to target property', () => {
      widget.item = item;
      widget.append(textInput);

      item.text = 'World';

      expect(textInput.text).to.equal('World');
      expect(item.text).to.equal('World');
    });

  });

});
