# Data Binding

## One-way bindings

### @component

Makes the decorated widget class the *base reference* for databinding. Also, a widget class decorated with `@component` will not allow its own children to be selected by any of its parents, preventing accidental manipulation due to clashing `id` or `class` values. The class itself can still select its own children using the protected methods `_children`, `_find` and `_apply`, or by using `@getById` on a private/protected property.

### JSX Attribute: bind-\<targetProperty\>=<Binding>

Where `<Binding>` can be
 * a path string of format `\<baseProperty\>[.\<subProperty\>]`
 * a plain object `{path: string, converter?: Function}`
 * or a call `to(path: string, converter: Function)`

For one-way bindings, `@component` enables a new JSX attribute prefix `bind-`, which actively copies values **from** the *base component* **to** the *target element* (a descendant widget).

Example:

```tsx
  @component
  class CustomComponent extends Composite {

    @property public myText: string = 'foo';

    constructor(properties: CompositeProperties) {
      super(properties);
      this.append(
        <textView bind-text='myText'/>
      );
    }

  }
```

This applies changes of the *base property* `myText` to the *target property* `text` of the *target element* `textView`. The *base property* must be a proper Tabris.js style property, not just a field. This can be achieved simply by adding a `@property` decorator, but a custom implementation also works as long as appropriate change events are fired. The bindings are resolved when append is called the first time. Appending/detaching widgets after that has no effect. If the *target* property is implemented in TypeScript it should be using `@property`, so type safety can be guaranteed (see below).

### Binding to sub-property

You can bind to a property of a *base property* value if its a model-like object:

```tsx
  @component
  class CustomComponent extends Composite {

    @property public item: {myText: string} = {str: 'foo'};

    constructor(properties: CompositeProperties) {
      super(properties);
      this.append(
        <textView bind-text='item.myText'/>
      );
    }

  }
```

The binding will not update the *target property* when the property on the item changes, only when the item is replaced.

#### Conversion

The value can be manipulated or converted to an entirely different type using a converter function.
This would convert a `Date` instance (`person.dob`) to a localized string:

```tsx
<textView bind-text={{path: 'person.dob', converter: v => v.toLocaleString())} />
```

There is also the utility function `to` exported by `tabris-decorators` that makes this expression slightly shorter:

```tsx
<textView bind-text={to('person.dob', v => v.toLocaleString())} />`
````

 It can also be used to define reuseable shorthands:

 ```tsx
 // define shorthand, maybe in some other module:
 const toLocaleString = (path: string) => to(path, v => v.toLocaleString());

 // later use:
<textView bind-text={toLocaleString('person.dob')} />
```

#### Fallback value

If the *base property* is set to `undefined`, the *target property* will be reset to its initial value (from the point in time when the binding was initialized). In the above example this would be an empty string, since that is the default value of the `TextView` property `text`. But it can also be the value that is given in JSX:

```tsx
<textView bind-text='myText' text='fallback value'/>
```

This behavior exists **only** for `undefined`, `null` is passed through without changes. To be able to set `undefined` on the *target property* via a binding you have to make that its initial value.

### @property

Makes the decorated object property a "real" Tabris.js property, meaning it can be set via constructor or `set` method (on widgets with proper type declarations), and it fires change events. This is especially useful when the property is supposed to be the source of a one-way data binding. It also performs type checks for the databinding system.

The `@property` decorators can be used in any class, not just subclasses of `Widget`. On a non-widget class change events are only fired [if a matching instance of `Listeners` is found](./event-handling.md):

```ts
@property public myText: string = 'foo';
@event public readonly onMyTextChanged: ChangeListeners<string>;

```

### @property(typeGuard: Function)

Like `@property`, but uses the given function (type guard) to perform type checks. The type guard may be more strict than the TypeScript compiler (e.g. allowing only positive numbers where the compiler allows any number), but should never be less strict, though it is technically possible.

The function may return either a boolean (`true` indicates the value passes), or throw an error explaining why the value did not pass.

Example:

```ts
  @component
  class CustomComponent extends Composite {

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    public mixedType: number[] | number = 0;

  }
```

### JSX Attribute: template-\<targetProperty\>='\<string\>${\<path\>}\<string\>'

A one-way binding where the *base value* is embedded in a template string.
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

## Two-Way bindings

### @bind({path: "#\<targetElementId\>.\<targetProperty\>", typeGuard?: Function})

Binds the decorated *base property* of a *base component* to the property of a *target element* (descendant widget). As with `@getById`, the binding is established after `append` is called the first time on the widget, there needs to be exactly one descendant widget with the given id, and it has to have a property of the same type.

`@bind` creates a two-way binding, meaning changes to the *target property* are reflected on the decorated *base property* and the other way around. Change events are fired for the decorated *base property* if (and only if) the *target element* fires change events. Only one `@bind` decorator can be applied to any given property. It also implies `@property` and includes its typeGuard feature. Only one of the two can be applied to the same property.

`@bind` only works on classes decorated with `@component`.

As with one-way bindings, setting the *base property* to `undefined` resets the *target property* to its initial value.


### @bind(path: string)

Shorthand for `@bind({path: string})`

## Other

### @getById

Lets the property return the descendant with the same id as the property name. The following rules apply:

 * It only works on classes decorated with `@component`.
 * It is read-only at runtime. Attempts to set the property fill fail silently.
 * It will search for a matching descendant widget exactly once, after `append` is called the first time on the widget instance.
 * If accessed before children have been appended it will throw an error.
 * It will always return the same descendant, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

## @getById(v => boolean)

Like `@getById`, but uses the given type guard to check the found widget, allowing widgets with compatible but not identical types to be resolved.

## Notes on type safety

The databinding system can not rely on the compiler to ensure type safety. Therefore runtime type checks need to be performed.

If the properties involved are decorated by `@property` or `@bind`, this will happen automatically. However, if either property type is an [advanced type](http://www.typescriptlang.org/docs/handbook/advanced-types.html) or an interface, this is not possible and the binding will fail as a precaution. To fix this you need to set the typeGuard parameter of `@property`/`@bind` to a function that performs the type check explicitly.

If the properties involved are not decorated by `@property` or `@bind` they are expected to perform the type check in the setter. While that is not enforced, all widgets built directly in to Tabris.js behave like this. If you need to perform explicit type checks in your code you may want to make use of the `checkType` function exported by `tabris-decorators`.
