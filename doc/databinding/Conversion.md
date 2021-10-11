---
---
# Class "Conversion"

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

Instances of the `Conversion` class are given as the second argument to any converter functions used in data binding.

> The [property converter functions of `@property`/`@prop`](./@property.md#configconvert) do *not* receive this object.

In all Tabris.js data binding APIs source values may be converted before the framework applies them to the target property. To do so a converter function is used, both in [one-way bindings via JSX](./@component.md#value-conversion) and one-way/two-way bindings via [`@bind`](./@bind.md#configconvert) or [`@bindAll`](./@bindAll.md#value-conversion).

> The TypeScript type of this function is exported as `BindingConverter` and is defined as:
> ```ts
>type BindingConverter<From = any, Target = any, TargetProperty extends string = any>
>   = (fromValue: From, conversion: Conversion<Target, TargetProperty>) => any | void;`
>```

**In most cases** such a function can simply take the original value it gets passed as the first parameter and return the converted value:

```ts
const toUpperCase: BindingConverter<string> = value => value.toUpperCase();
```

However, the function can also take in to consideration who will receive the converted value. This is especially relevant in the case of two-way bindings, as the same function is responsible for conversions in both directions. The `Conversion` object allows to identify the target of the conversion and provides a callback that the result of the conversion may be passed to.

## Examples

A `BindingConverter` that converts to upper case when it targets a `TextInput` widget, otherwise to lower case:

```ts
const toUpperCase: BindingConverter = (value: string, conversion) =>
  conversion.resolve(conversion.targets(TextInput, 'text') ? value.toUpperCase() : value.toLowerCase());
}
```

> :point_right: See example app ["bind-two-way-convert"](../../examples/bind-two-way-convert).

## Methods

All methods of `Conversion` are bound to the instance, meaning parameter destructuring may be used to call them:

```js
(value, {targets, resolve}) => resolve(targets(Type) ? x : y);
```

### targets(type, property?)

Returns true if the target of the conversion is of the given `type` (constructor) and `property` (string) of the target. If no `property` is given only the type is checked. *The target type needs to be an exact match, subclasses or implementations of the given type do not count.*

### resolve(value)

An alternative way to pass the converted value to the framework is to call this method. If this is done the function must not return a value. It must also not be called twice.

## Properties

All properties are read-only.

### proto

The [prototype object](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes) of the conversion target.

### property

The name (`string`) of the targeted property.
