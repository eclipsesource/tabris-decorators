---
---
# @property

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

Makes the decorated object property fire change events and perform runtime value checks, which is the expected behavior of [widget properties in Tabris.js](../widget-basics.md#widget-properties). It makes the property a valid source for one-way data bindings on [`@component`](./@component.md) decorated widgets. The `@property` decorators can be used in any class, not just subclasses of `Widget`. On a non-widget class change events may be listened to via [an instance of `ChangeListeners` attached to an appropriately named property](./@event.md).

## @property (no parameter)

> See example apps ["property-change-events"](../../examples/property-change-events) (TypeScript) and ["property-change-events-jsx"](../../examples/property-change-events) (JavaScript/JSX).

Triggers change events and (in TypeScript) performs implicit runtime checks on any value the property is set to.

```ts
class Foo {
  @property myText: string = 'foo';
  @event onMyTextChanged: ChangeListeners<Foo, 'myText'>;
}

const foo = new Foo();
foo.onMyTextChanged(ev => console.log(ev.value));
foo.myText = 'bar'; // logs "bar" due to the change event
(foo as any).myText = 23; // throws due to the implicit value check
```

[**In JavaScript these checks do not happen unless the `type` option is set.**](#configtype)

The implicit runtime check only works with primitive types and classes. [Advanced type](http://www.typescriptlang.org/docs/handbook/advanced-types.html) and interfaces can not be checked:

```ts
class Foo {
  @property myItem: {bar: string};
}

const foo = new Foo();
foo.myItem = {bar: 'foo'}; // OK
(foo as any).myItem = {foo: 'bar'}; // runtime check passes despite incorrect type
```

In these cases it is recommended to use a [type guard](#configtypeguard).

## @property(config)

Like `@property`, but with more options.

### config.typeGuard

Where `typeGuard` is of the type `(value: any) => boolean`.

> See example app ["property-value-checks"](../../examples/property-value-checks).

Uses the given function (type guard) to perform type checks. The type guard may be more strict than the TypeScript compiler (e.g. allowing only positive numbers where the compiler allows any number), but should never be less strict.

The function may return either a boolean (`true` indicates the value passes), or throw an error explaining why the value did not pass.

Example for a type guard more strict than the compiler:

```ts
  @component
  class CustomComponent extends Composite {

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    mixedType: number[] | number = 0; // compiler would allow -1, but not the type guard

  }
```

### config.type

**This option is only useful in JavaScript/JSX files.**

Where `type` is a constructor function.

When providing this option the property will check that every assigned value (except `null`) is an instance of the given constructor function, such as `Date`. Primitives (`number`, `string`, `boolean`) are represented by the constructors of their [boxed/wrapped values](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript).

JavaScript Example:

```ts
class Foo {

  /** @type {Date} */
  @property({type: Date})
  myDate = new Date();

  /** @type {string} */
  @property({type: String})
  myText = 'foo';

}
```

This is the exact equivalent of the following TypeScript code:

```ts
class Foo {
  @property myDate: Date = new Date();
  @property myText: string = 'foo';
}
```
