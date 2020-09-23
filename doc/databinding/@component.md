---
---
# @component

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

A decorator for classes extending `Composite` (directly or indirectly), otherwise known as a "custom component". It provides the following features:

## One way bindings

> :point_right: See example apps ["bind-one-way"](../../examples/bind-one-way) (TypeScript) and ["bind-one-way-jsx"](../../examples/bind-one-way-jsx).

For one-way bindings, `@component` enables JSX attributes of the following format:

```
bind-<targetProperty>=<Binding>
```

Where `<Binding>` can be
 * a path string of the format `'<componentProperty>[.<property>]*'` defining the *source property* of the binding
 * an object of the type `{path: string, converter?: Function}`
 * or a call `to(path: string, converter: Function)` ("`to`" must be imported from `'tabris-decorators'`)

This applies the value of the *source property* to the *target element property*. All future changes to the source property are reflected on the target property. The target element has to be a child (direct or indirect) of the component. All target elements are determined when `append` is called the first time. Appending or detaching widgets after that has no effect.

Example:

```tsx
@component
class CustomComponent extends Composite {

  @property myText: string = 'foo';

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextView bind-text='myText'/>
    );
  }

}
```

This applies changes of the *component property* `myText` - the *source property* of this binding - to the *target property* `text` of the *target element* `TextView`. **The component property has to fire [change events](../widget-basics.md#widget-properties) for this to work.** That can be achieved by either adding a [`@property`](./@property.md) decorator to the component property (recommended, see above example), or by explicitly implementing a setter and getter like in this full example:

```tsx
import { Composite, ChangeListeners, Properties, TextView } from 'tabris';
import { component, event } from 'tabris-decorators';

@component
export class CustomComponent extends Composite {

  @event onMyTextChanged: ChangeListeners<CustomComponent, 'myText'>;
  private _myText: string = 'foo';

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextView bind-text='myText'/>
    );
  }

  set myText(value: string) {
    this._myText = value;
    this.onMyTextChanged.trigger({value});
  }

  get myText() {
    return this._myText;
  }

}
```

### Binding to nested properties

> :point_right: See example apps ["bind-one-way"](../../examples/bind-one-way) (TypeScript) and ["bind-one-way-jsx"](../../examples/bind-one-way-jsx) (JavaScript/JSX).

The *source property* of a binding can also be a property of a *component property* value if its an object:

```tsx
class MyItem {
  @property myText: string = 'foo';
}

@component
class CustomComponent extends Composite {

  @property item: MyItem = new MyItem();

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextView bind-text='item.myText'/>
    );
  }

}
```

Even deeply nested property paths are supported, e.g. `bind-text='some.deep.nested.property'`. If the object hierarchy ends prematurely the binding resolves to `undefined`, as though the source property had that value. An example would be `bind-text='foo.bar.baz'` where `'foo.bar'` is already null. See also ["Fallback Value"](#fallback-value).

**As with binding to *component properties*, the `MyItem` class above needs to fire change events for `myText`, otherwise it would be treated as immutable.** Example:

```ts
const component = new CustomComponent();
contentView.append(component);
const item1 = new MyItem();
item1.myText = 'text1';
component.item = item1; // OK


component.item.myText = 'text2'; // OK?
```

That last line would not update the binding if `MyItem` was implemented like this, without `@property`:

```ts
class MyItem {
  myText: string = 'foo';
}
```

But it would still update the binding by doing this:
```ts
const item2 = new MyItem();
item2.myText = 'text2';
component.item = item1; // OK even without @property
```

`MyItem` could also implement explicit setter and getter to fire change events, exactly like the `CustomComponent` example above. Both `@property` and `@event` work on any class, not just widgets. Objects created via JSON (object literals) can be used in a binding, but since they don't fire change events they are treated as immutable.

### Conversion

> See example apps ["bind-and-convert"](../../examples/bind-and-convert) (TypeScript) and ["bind-and-convert-jsx"](../../examples/bind-and-convert-jsx) (JavaScript/JSX).

The value of the *source property* can be manipulated or converted in a binding using a converter function.

In this example `Date` instance `person.dob`, (date of birth) will be converted to a localized string:

{% raw %}
```tsx
<TextView bind-text={{path: 'person.dob', converter: v => v.toLocaleString()}} />
```
{% endraw %}

There is also a utility function `to` that makes this expression slightly shorter:

```tsx
import {to} from 'tabris-decorators';

//...

<TextView bind-text={to('person.dob', v => v.toLocaleString())} />`
```

 It can also be used to define reuseable shorthands:

 ```tsx
 // define shorthand, maybe in some other module:
 const toLocaleString = (path: string) => to(path, v => v.toLocaleString());

 // later use:
<TextView bind-text={toLocaleString('person.dob')} />
```

### Fallback Value

If the binding resolves to `undefined`, the *target property* will be reset to its initial value (from the point in time when the binding was initialized). In the above examples the initial value would be an empty string, since that is the default value of the `TextView` property `text`. But it can also be the value that is given in JSX:

```tsx
<TextView bind-text='myText' text='fallback value'/>
```

This behavior exists **only** for `undefined`, `null` is passed through without changes. To be able to set `undefined` on the *target property* via a binding you have to make that its initial value.

### Template Strings

Using `template-` as a JSX attribute prefix creates a one-way binding where the *source property* value is embedded in a template string:

```
template-<targetProperty>='<string>${<path>}<string>'
```

The template has to contain exactly one `${<path>}` placeholder, where `<path>` is a string of the same syntax as one-way bindings using the `bind-` prefix. While this feature lends from the JavaScript template string syntax, it is not using backticks!

Example:

```tsx
  @component
  class CustomComponent extends Composite {

    @property name: string = 'Peter';

    constructor(properties: CompositeProperties) {
      super(properties);
      this.append(
        <TextView template-text='Hello ${name}!' text='No one here?'/>
      );
    }

  }
```

This results in `'Hello Peter!'` initially, and falls back to `'No one here?'` if `name` is set to `undefined`.

## Two way bindings

See [@bind](./@bind.md) and [@bindAll](./@bindAll.md)

## Direct Child Access

See [@getById](./@getById.md).


## Encapsulation

A widget class decorated with `@component` will not allow its own children (direct or indirect) to be selected by API or by any of its parents, preventing accidental manipulation due to clashing `id` or `class` values. The class itself can still select its own children using the protected methods `_children`, `_find` and `_apply`, or by using [@getById](./@getById.md) on a private/protected property. The example below uses `_find`:

TypeScript:

```tsx
@component
class CustomComponent extends Composite {

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextInput id='foo' text='bar'/>
    );
  }

  getFoo() {
    return this._find('#foo').only(TextInput).text;
  }

}

const myComponent = new CustomComponent();

// Prints 'bar':
console.log(myComponent.getFoo());

// Throws since no matching widget can be found:
console.log(myComponent.find('#foo').only(TextInput).text);
```

The same component in JavaScript:

```jsx
@component
class CustomComponent extends Composite {

  /** @param {tabris.Properties<Composite>} properties */
  constructor(properties) {
    super();
    this.set(properties).append(
      <TextInput id='foo' text='bar'/>
    );
  }

  getFoo() {
    return this._find('#foo').only(TextInput).text;
  }

}
```

The only difference is how - if at all - the `properties` parameter is typed. In JavaScript JSDoc comments may be used, but this is optional. This is true for all examples below, so only the TypeScript variant will be given.
