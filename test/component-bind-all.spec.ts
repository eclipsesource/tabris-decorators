import 'mocha';
import 'sinon';
import { ChangeListeners, Composite, Properties, tabris, TextInput } from 'tabris';
import ClientMock from 'tabris/ClientMock';
import { expect, stub } from './test';
import { bind, bindAll, component, event, property } from '../src';
/* tslint:disable:no-unused-expression no-unused-variable max-classes-per-file max-file-line-count*/

describe('component', () => {

  class Item {
    @event public onTextChanged: ChangeListeners<Item, 'text'>;
    @property public text: string = 'Hello';
  }

  let item: Item;
  let textInput: TextInput;

  beforeEach(() => {
    tabris._init(new ClientMock());
    item = new Item();
  });

  describe('@bind({all})', () => {

    @component
    class CustomComponent extends Composite {

      @bind({all: {
        text: '#foo.text'
      }})
      public item: Item;

      constructor(properties?: Properties<CustomComponent>) {
        super(properties);
      }

    }

    let widget: CustomComponent;

    beforeEach(() => {
      tabris._init(new ClientMock());
      widget = new CustomComponent();
      item = new Item();
      textInput = new TextInput({id: 'foo'});
    });

    it('fails to decorate primitive', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {length: '#bar.foo'}})
          public item: string;
        }
      }).to.throw(Error, 'Property type needs to extend Object');
    });

    it('fails to decorate with missing paths', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {}})
          public item: Item;
        }
      }).to.throw(Error, 'Missing binding path(s)');
    });

    it('fails to decorate with invalid path', () => {
      expect(() => {class Test extends Composite {
        @bind({all: {text: 'foo'}})
        public item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path needs to start with "#".');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo.bar.baz'}})
        public item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path has too many segments.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo[bar]'}})
        public item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: ' #foo.bar'}})
        public item: Item;
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
      let listener = stub();
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
      }).to.throw(Error, 'Binding "item.text" <-> "#foo.text" failed: Target does not have a property "text".');
    });

    it('fails on append if target property has no setter', () => {
      const target = new Composite({id: 'foo'});
      (target as any).text = 'foo';
      expect(() => {
        widget.append(target);
      }).to.throw(Error,
        'Binding "item.text" <-> "#foo.text" failed: Target property "text" does not perform type checks.'
      );
    });

    it('fails on append if target property is marked unchecked', () => {
      class TargetComponent extends Composite {
        @property public text: true | string;
      }
      expect(() => {
        widget.append(new TargetComponent({id: 'foo'} as any));
      }).to.throw(Error,
        'Binding "item.text" <-> "#foo.text" failed: Target property "text" needs a type guard.'
      );
    });

    it('fails setting item when source property does not exist', () => {
      class ItemB { public text: string; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) public item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'Failed to set property "item": Object does not have a property "text".'
      );
    });

    it('fails setting item when source property has no setter', () => {
      class ItemB { public text: string = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) public item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'Failed to set property "item": Object property "text" does not perform type checks.');
    });

    it('fails setting item when source property is marked unchecked', () => {
      class ItemB { @property public text: string | boolean = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) public item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'Failed to set property "item": Object property "text" needs a type guard.'
      );
    });

  });

  describe('@bind({all, typeGuard})', () => {

    @component class ComponentWithTypeGuard extends Composite {
      @bind({
        all: {text: '#foo.bar'},
        typeGuard: v => (typeof v.text === 'string') || v === undefined
      })
      public value: {text: string};
    }

    class PlainItem {
      private _str: string;
      set text(str: string) {
        this._str = str;
      }
      get text(): string {
        return this._str;
      }
    }

    it('throws if own value is rejected by type guard', () => {
      const value = new PlainItem();
      (value as any).text = 23;
      expect(() => (new ComponentWithTypeGuard()).value = value).to.throw(
        'Failed to set property "value": Type guard check failed'
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

    @component
    class CustomComponent extends Composite {

      @bindAll({
        text: '#foo.text'
      })
      public item: Item;

    }

    let widget: CustomComponent;

    beforeEach(() => {
      tabris._init(new ClientMock());
      widget = new CustomComponent();
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