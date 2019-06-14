---
---
# @property

> :point_right: Make sure to first read the introduction to [decorators](./index.md).

Makes the decorated object property fire change events and perform runtime value checks, which is the expected behavior of [widget properties in Tabris.js](../widget-basics.md#widget-properties). It makes the property a valid source for one-way data bindings on [`@component`](./@component.md) decorated widgets. The `@property` decorators can be used in any class, not just subclasses of `Widget`. On a non-widget class change events may be listened to via [an instance of `ChangeListeners` attached to an appropriately named property](./@event.md).

## @property (no parameter)

Triggers change events and performs implicit runtime checks on any value the property is set to.

```ts
class Foo {
  @property public myText: string = 'foo';
  @event public onMyTextChanged: ChangeListeners<Foo, 'myText'>;
}

const foo = new Foo();
foo.onMyTextChanged(ev => console.log(ev.value));
foo.myText = 'bar'; // logs "bar" due to the change event
(foo as any).myText = 23; // throws due to the implicit value check
```

The implicit runtime check only works with primitive types and classes. [Advanced type](http://www.typescriptlang.org/docs/handbook/advanced-types.html) and interfaces can not be checked:

```ts
class Foo {
  @property public myItem: {bar: string};
}

const foo = new Foo();
foo.myItem = {bar: 'foo'}; // OK
(foo as any).myItem = {foo: 'bar'}; // runtime check passes despite incorrect type
```

In these cases it is recommended to use a type guard:

## @property(typeGuard)

Where `typeGuard` is of the type `(value: any) => boolean`.

Like `@property`, but uses the given function (type guard) to perform type checks. The type guard may be more strict than the TypeScript compiler (e.g. allowing only positive numbers where the compiler allows any number), but should never be less strict.

The function may return either a boolean (`true` indicates the value passes), or throw an error explaining why the value did not pass.

Example for a type guard more strict than the compiler:

```ts
  @component
  class CustomComponent extends Composite {

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    public mixedType: number[] | number = 0; // compiler would allow -1, but not the type guard

  }
```
