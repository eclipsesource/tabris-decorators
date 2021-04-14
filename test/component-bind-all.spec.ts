import 'mocha';
import 'sinon';
import {ChangeListeners, Composite, Properties, tabris, TextInput} from 'tabris';
import ClientMock from 'tabris/ClientMock';
import {expect, stub} from './test';
import {bind, bindAll, component, event, property, Injector, inject} from '../src';

const injector = new Injector();
const {injectable} = injector;

describe('component', () => {

  @injectable
  class Item {
    @event onTextChanged: ChangeListeners<Item, 'text'>;
    @property text: string = 'Hello';
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

      @bind({all: {text: '#foo.text'}})
      item: Item;

      constructor(properties?: Properties<CustomComponent>) {
        super(properties);
      }

    }

    @injectable @component
    class Injectable extends Composite {
      @inject @bindAll({text: '#foo.text'})
      item: Item;
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
          item: string;
        }
      }).to.throw(Error, 'Property type needs to extend Object');
    });

    it('fails to decorate with missing paths', () => {
      expect(() => {
        class Test extends Composite {
          @bind({all: {}})
          item: Item;
        }
      }).to.throw(Error, 'Missing binding path(s)');
    });

    it('fails to decorate with invalid path', () => {
      expect(() => {class Test extends Composite {
        @bind({all: {text: 'foo'}})
        item: Item;
      }}).to.throw(Error,
        'Could not apply decorator "bind" to "item": Binding path must start with direction or selector.'
      );
      expect(() => {class Test extends Composite {
        @bind({all: {text: '.foo'}})
        item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Class selectors are not allowed');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo.bar.baz'}})
        item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path has too many segments.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: '#foo[bar]'}})
        item: Item;
      }}).to.throw(Error, 'Could not apply decorator "bind" to "item": Binding path contains invalid characters.');
      expect(() => {class Test extends Composite {
        @bind({all: {text: ' #foo.bar'}})
        item: Item;
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

    describe('with "<<" prefix', () => {

      @component
      class ToLeft extends Composite {
        @bind({all: {text: '<< #foo.text'}})
        item: Item;
      }

      beforeEach(() => widget = new ToLeft());

      it('applies current target property value to set item property on append', () => {
        item.text = 'Hello';
        textInput.text = 'World';
        widget.item = item;

        widget.append(textInput);

        expect(item.text).to.equal('World');
        expect(textInput.text).to.equal('World');
      });

      it('applies current target property value to set item property when setting item', () => {
        item.text = 'Hello';
        textInput.text = 'World';
        widget.append(textInput);

        widget.item = item;

        expect(item.text).to.equal('World');
        expect(textInput.text).to.equal('World');
      });

      it('do not apply item property value to target', () => {
        widget.item = item;
        widget.append(textInput);

        widget.item.text = 'ignore';

        expect(textInput.text).to.equal('');
      });

      it('ignores item property changes during target property change', () => {
        widget.item = item;
        widget.append(textInput);
        item.onTextChanged(({value}) => {
          item.text = 'other';
        });

        textInput.text = 'World';

        expect(textInput.text).to.equal('World');
        expect(item.text).to.equal('other');
      });

    });

    it('selects target by type', () => {
      @component
      class ByType extends Composite {
        @bindAll({text: 'TextInput.text'})
        item: Item;
      }
      widget = new ByType();

      widget.append(textInput);
      widget.item = item;

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('selects self via :host selector', () => {
      @component
      class ToHost extends Composite {
        @bindAll({text: ':host.id'})
        item: Item;
      }
      widget = new ToHost();
      widget.append(new TextInput());

      widget.item = item;

      expect(widget.id).to.equal('Hello');
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

    describe('with ">>" prefix', () => {

      @component
      class ToRight extends Composite {
        @bind({all: {text: '>> #foo.text'}})
        item: Item;
      }

      beforeEach(() => widget = new ToRight());

      it('do not apply target property value to item', () => {
        widget = new ToRight();
        widget.item = item;
        widget.append(textInput);

        textInput.text = 'ignore';

        expect(widget.item.text).to.equal('Hello');
      });

      it('accepts item with source property marked unchecked', () => {
        class ItemB { @property text: string | boolean = 'Hello'; }
        @component class CustomComponentB extends Composite {
          @bind({all: {text: '>> #foo.text'}}) item: ItemB;
        }

        expect(() => new CustomComponentB().item = new ItemB()).not.to.throw(Error);
      });

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
      }).to.throw(Error, /Composite does not have a property "text"/);
    });

    it('fails on append if target property has no setter', () => {
      const target = new Composite({id: 'foo'});
      (target as any).text = 'foo';
      expect(() => {
        widget.append(target);
      }).to.throw(Error, /Composite property "text" has no setter, missing @prop \/ @property?/);
    });

    it('fails on append if target property is marked unchecked', () => {
      class TargetComponent extends Composite {
        @property text: true | string;
      }
      expect(() => {
        widget.append(new TargetComponent({id: 'foo'} as any));
      }).to.throw(Error, /Right hand property "text" requires an explicit type check\./);
    });

    it('fails setting item when source property does not exist', () => {
      class ItemB { text: string; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'ItemB does not have a property "text".');
    });

    it('fails setting item when source property has no setter', () => {
      class ItemB { text: string = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'ItemB property "text" has no setter, missing @prop / @property?');
    });

    it('fails setting item when source property is marked unchecked', () => {
      class ItemB { @property text: string | boolean = 'Hello'; }
      @component class CustomComponentB extends Composite {
        @bind({all: {text: '#foo.text'}}) item: ItemB;
      }

      expect(() => {
        new CustomComponentB().item = new ItemB();
      }).to.throw(Error, 'Object property "text" requires an explicit type check.');
    });

    it('works with @inject', () => {
      widget = injector.create(Injectable);

      widget.append(textInput);

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

    it('works with @inject on injected', () => {
      widget = injector.resolve(Injectable);

      widget.append(textInput);

      expect(textInput.text).to.equal('Hello');
      expect(item.text).to.equal('Hello');
    });

  });

  describe('@bind({all, typeGuard})', () => {

    @component class ComponentWithTypeGuard extends Composite {
      @bind({
        all: {text: '#foo.bar'},
        typeGuard: v => (typeof v.text === 'string') || v === undefined
      })
      value: {text: string};
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
        'Type guard check failed'
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
      item: Item;

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
