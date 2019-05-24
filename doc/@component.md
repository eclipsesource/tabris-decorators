---
---
# @component

> :point-right: Make sure to first read the introduction to [decorators](./index.md).

Makes the decorated widget class a "custom component" with the following features:

## Isolation

A widget class decorated with `@component` will not allow its own children to be selected by public API or by any of its parents, preventing accidental manipulation due to clashing `id` or `class` values. The class itself can still select its own children using the protected methods `_children`, `_find` and `_apply`, or by using [@getById](./@getById.md) on a private/protected property.

```tsx
@component
class CustomComponent extends Composite {

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextInput id='foo' text='bar'/>
    );
  }

  public getFoo() {
    return this._find('#foo').only(TextInput).text;
  }

}

const myComponent = new CustomComponent();

// Prints 'bar':
console.log(myComponent.getFoo());

// Throws since no matching widget can be found:
console.log(myComponent.find('#foo').only(TextInput).text);
```

## One way bindings

For one-way bindings, `@component` enables JSX attributes of the following format:

```
bind-<targetProperty>=<Binding>
```

Where `<Binding>` can be
 * a path string of format `<componentProperty>[.<subProperty>]`
 * a plain object `{path: string, converter?: Function}`
 * or a call `to(path: string, converter: Function)`

This actively copies values **from** the *component* **to** the *target element*. The target element has to be a child (or indirect descendant) widget.

Example:

```tsx
@component
class CustomComponent extends Composite {

  @property public myText: string = 'foo';

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextView bind-text='myText'/>
    );
  }

}
```

This applies changes of the *component property* `myText` to the *target property* `text` of the *target element* `textView`. The *component property* must be a proper Tabris.js style property, not just a field. This can be achieved simply by adding a `@property` decorator, but a custom implementation also works as long as appropriate change events are fired. The bindings are resolved when append is called the first time. Appending/detaching widgets after that has no effect.

### Binding to sub-property

You can bind to a property of a *component property* value if its a model-like object:

```tsx
class MyItem {
  public myText: string = 'foo';
}

@component
class CustomComponent extends Composite {

  @property public item: MyItem = new MyItem();

  constructor(properties?: Properties<Composite>) {
    super();
    this.set(properties).append(
      <TextView bind-text='item.myText'/>
    );
  }

}
```

The item is treated as immutable, meaning The binding will not update the *target property* when the property on the item changes, only when the item is replaced.

### Conversion

The value of the component property can be manipulated or converted in a binding using a converter function.

This would convert a `Date` instance (`person.dob`) to a localized string:

{% raw %}
```tsx
<TextView bind-text={{path: 'person.dob', converter: v => v.toLocaleString()}} />
```
{% endraw %}

There is also the utility function `to` exported by `tabris-decorators` that makes this expression slightly shorter:

```tsx
<TextView bind-text={to('person.dob', v => v.toLocaleString())} />`
```

 It can also be used to define reuseable shorthands:

 ```tsx
 // define shorthand, maybe in some other module:
 const toLocaleString = (path: string) => to(path, v => v.toLocaleString());

 // later use:
<TextView bind-text={toLocaleString('person.dob')} />
```

### Fallback value

If the *component property* is set to `undefined`, the *target property* will be reset to its initial value (from the point in time when the binding was initialized). In the above example this would be an empty string, since that is the default value of the `TextView` property `text`. But it can also be the value that is given in JSX:

```tsx
<TextView bind-text='myText' text='fallback value'/>
```

This behavior exists **only** for `undefined`, `null` is passed through without changes. To be able to set `undefined` on the *target property* via a binding you have to make that its initial value.

### Template strings

Using `template-` as a JSX attribute prefix creates a one-way binding where the *component property* value is embedded in a template string:

```
template-<targetProperty>='<string>${<path>}<string>'
```

The template has to contain exactly one `${<path>}` placeholder, where `<path>` is a string of the same syntax as one-way bindings using the `bind-` prefix.

Example:

```tsx
  @component
  class CustomComponent extends Composite {

    @property public name: string = 'Peter';

    constructor(properties: CompositeProperties) {
      super(properties);
      this.append(
        <textView template-text='Hello ${name}!' text='No one here?'/>
      );
    }

  }
```

This results in `'Hello Peter!'` initially, and falls back to `'No one here?'` if `name` is set to `undefined`.

### Notes on type safety

The data binding enabled by `@component` can not rely on the TypeScript compiler to ensure type safety. Therefore runtime type checks need to be performed.

For all properties of built-in Tabris.js widgets this is already the case. Also, if a property is decorated with `@property` or `@bind`, value checks happen automatically. However, if the property type is an [advanced type](http://www.typescriptlang.org/docs/handbook/advanced-types.html) or an interface, this is not possible and the binding will fail as a precaution. In this case you need to set the [typeGuard](./@property.md) parameter of `@property`/`@bind` to perform the check explicitly.

If the properties involved are not decorated by `@property` or `@bind` they are expected to perform the type check in the setter.

## Two way bindings

See [@bind](./@bind.md).

## Direct Child Access

See [@getById](./@getById.md).
