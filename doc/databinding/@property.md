---
---
# @property

> :point_right: Make sure to first read the [introduction to data binding](./index.md).

Extends the behavior of a property. Most importantly it will generate change events, thereby making it a valid source for one-way data bindings on widgets decorated with [`@component`](./@component.md). If the type of the property is known at runtime it can also check and convert the incoming value. In JavaScript the type can be made known using the [`type`](#configtype) option, while in TypeScript is provided automatically by the compiler.

The `@property` decorator can be used in any class, not just subclasses of `Widget`. On a non-widget class change events may be listened to via [an instance of `ChangeListeners` attached to an appropriately named property](./@event.md).

## @property (no parameter)

> :point_right: See example apps ["property-change-events"](../../examples/property-change-events) (TypeScript) and ["property-change-events-jsx"](../../examples/property-change-events) (JavaScript/JSX).

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



## @property(fn)

A shorthand for `@property({typeGuard: fn})`. See ["config.typeGuard"](#configtypeguard).

## @property(config)

Like `@property`, but with more options.

### config.type

Where `type` is a constructor function.

**This option is usually not required in TypeScript, only in JavaScript/JSX files. A possible exception is using it with a [converter](#configconvert).**

When providing this option the property will check that every assigned value is an instance of the given constructor function, such as `Date`. Primitives (`number`, `string`, `boolean`) are represented by the constructors of their [boxed/wrapped values](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#primitive_wrapper_objects_in_javascript).

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

It is currently not possible to use `type` to describe interfaces (for "duck typing") or mixed types (e.g. "string or number"). However, type checking for such cases can be achieved using a [type guard](#configtypeguard).

### config.typeGuard

Where `typeGuard` is of the type `(value: any) => boolean`.

> :point_right: See example app ["property-value-checks"](../../examples/property-value-checks).

Uses the given function (type guard) to perform type checks. The type guard may be more strict than the TypeScript compiler (e.g. allowing only positive numbers for a `number` property), but should never be less strict.

The function may return either a boolean (`true` indicates the value passes), or throw an error explaining why the value did not pass.

Example for a type guard more strict than the compiler:

```ts
  @component
  class CustomComponent extends Composite {

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    mixedType: number[] | number = 0; // compiler would allow -1, but not the type guard

  }
```

By using multiple `@property` decorator on the same property you can give multiple type guards. They are executed in the given order.


### config.default

Where `default` can be any value except `undefined`, which turns the feature off.

Defines the initial value of this property. It will also be used as the fallback value if the property is [not nullable](#confignullable). If a [converter](#configconvert) is defined it will be applied to the default value as well.

Using `default` differs from setting the property with the declaration, which changes the value only *after* `super` has been called. Thus it allows setting the property in a super-constructor:

```ts
@component
class MyComponent extends Composite {

  // Bad:
  // @property num: number = 0;

  // Good:
  @property({default: 0})
  num: number;

  constructor(properties: Properties<MyComponent>) {
    super(properties);
    this.append(/*...*/);
  }

}

console.log(new MyComponent({}).num); // "0"
console.log(new MyComponent({num: 1}).num); // "1"
```

Alternatively you can use `this.set(properties);` instead of `super(properties);`. In that case it doesn't matter how the property is initialized.

### config.nullable

Where `nullable` is a boolean. The default is `true`.

Dictates whether the property can be set to `null` or `undefined`. If set to `false` the initial value may be `null`/`undefined` (assuming no [default](#configdefault) value is defined), but it can not change to have these values later.

How this is achieved depends on the "[default](#configdefault)" and "[convert](#configconvert)" options. Here is what happens when a non-nullable property is set to `null` or `undefined`:

Target type | Option "default" | Option "convert"      | Result
------------|------------------|-----------------------|-----------------
any type    | set              |  any value            | value reset to default
any type    | not set          | `'off'`               | Exception thrown
primitive   | not set          | `'auto'` or function  | Value converted
object type | not set          | `'auto'` or function  | Exception thrown

### config.observe

Where `observe` is a boolean. The default is `false`. Has no effect on properties containing primitives.

If set to `true`, the property will fire a change event for itself whenever its contained object fires a change event for any of its own properties:

```ts
class MyData {

  @property({observe: true})
  data: OtherData;

  @event
  onOtherDataChanged: ChangeListeners<ObserveExample, 'data'>;

}

const data = new MyData();
data.onOtherDataChanged(ev => console.log(ev.value?.foo));

const otherData = new OtherData();
otherData.foo = 1;
data.otherData = otherData; // logs "1"
otherData.foo = 2; // logs "2"
```

The change event fired by the "observing" property (here: `data`) will have a reference to the change event that caused it:

```ts
data.onOtherDataChanged(ev => console.log(ev.originalEvent?.value));
```

If the change event was caused by the "observing" property itself receiving a new value (e.g. another object or `null`) the `originalEvent` property will be `null`.

The [`data` property of `Widget`](../api/Widget.md#data) and [the `item` property of `Cell`](../api/Cell.md#item) both are "observing" properties. All properties [of an `ObservableData` instance](../api/ObservableData.md) are as well, and any property decorated with `@bind`, `@bindAll` or `@prop`.

This feature is intended to be used with the [`apply` attribute/method](../selector.md#reactive-apply) or the `@bind`/`@bindAll` decorators in scenarios where values for the UI are computed based on models that are nested within each other.

Examples can be found here:
 * ["property-change-events"](../../examples/property-change-events) and ["property-change-events-jsx"](../../examples/property-change-events-jsx): Use change listeners to react to any change in a nested model.
 * ["bind-one-way-ts"](../../examples/bind-one-way-ts): Use the `@bind` decorators to bind to a nested model.
 * ["listview-cells-js"](../../examples/listview-cells-js): Use the `apply` attribute to update a cell when an item is selected.

### config.equals

Where `equals` is `'strict'`, `'shallow'`, `'auto'` or a function. Default is `'strict'`.

Controls how the property determines whether a new value would be equal to the current one. If both are considered equal the new value will be discarded in favor of the current one and no change event will fire.

When set to `'strict'` both values are only considered equal if they are identical, i.e. `a === b`. Two objects or arrays will never be considered equal, even if they contain the same values.

When set to `'shallow'` two object values will be considered equal if they have the exact same properties set to the exactly (strictly equal) same values. If used with arrays they also have to have the same length, even if all the additional slots of the longer array are empty. As the name implies this is not a "deep equal" check, so it is best used with arrays of primitives or simple models.

When set to `'auto'` it will use the `'strict'` strategy for primitives and `'shallow'` for arrays and *plain* objects, i.e. object literals like `{foo: 'bar'}`. Also, two objects will be considered equal if they have the same constructor and return the same primitives when the `valueOf()` method is called. Lastly, if an object implements a method called `equals` that takes exactly one parameter it will be called with the other object to test equality. If it returns `true` the objects are considered equal.

When set to a function it will be called with the two values to compare. They will be considered equal if the return value is true. If the function throws the exception will be propagated to the code that is setting the property.

### config.convert

Where `convert` is `'off'`, `'auto'` or a function. Default is `'off'`.

Allows to convert a value that is assigned to the property to the specified type of the property. This works regardless of how the value is set - directly (`obj.prop = value`), using the `set()` method, on declaration, via the [default](#configdefault) option, or by data binding. In JavaScript it requires the [type](#configtype) option to be set. In TypeScript this is not required unless the runtime type differs from the compile time type. (See "Usage with TypeScript" section below.) If the type of the property is unknown a warning will be printed and no conversion will be applied.

If set to `'off'` no conversion is applied. All values will be set (or rejected) as-is.

If set to `'auto'` the property will attempt to convert any new value to the expected type if the result would be semantically similar. See "Conversion strategies" below.

**The `'auto'` conversion does not work with interfaces, mixed types or plain objects as the target type.**

If set to a function, it will be called with the incoming value and must return a value of the expected type. If the value is already of the expected type the function will *not* be called, so it can for example not be used to convert a string to another string. The function may throw an exception if the incoming value can not be converted. The exception will be propagated to the code that is setting the property. If a [type guard](#configtypeguard) is present it will be called *after* the converter with the result of the conversion.

The converter function will never be called with `null` or `undefined`.

#### Usage with TypeScript

In TypeScript the compiler should prevent the code from directly assigning a value of the wrong type to the property. However, in data bindings there is no compile time check, so in this case a converter makes a property bindable to other properties of different types. Without a proper converter an exception would be thrown due to the type mismatch. The feature may also be useful when dealing with the `any` type, for example as the result of `JSON.parse()` or a REST call.

It is also valid to explicitly set the [type](#configtype) option to a *subset* of the TypeScript type. This is necessary for the converter to work if the TypeScript (compile-time) type is an "advanced" type such as a union of mixed types. The result - assuming the converter can handle the value - will be that any value that matches the compile time type can be set, but on get the value will always be of the type specified in the "config" object. This works for most tabris built-in data types.

Example:

```ts
@property({type: Color, convert: 'auto', equals: 'auto'})
color: ColorValue;

// Or just:
@prop(Color)
color: ColorValue;
```

Like with built-in widgets types, this `color` property can be assigned any `ColorValue` such as `'red'` or `'#ff0000'`, but will always return a `Color` instance.

#### Conversion strategies

The `'auto'` converter can convert between a number of types, but only if the value can be plausibly expressed in the target type. It therefore does *NOT* work like JavaScript type coercion, and it is also *NOT* always symmetric. If there is no plausible strategy for conversion the setter will throw an exception.

Below is a list of strategies for each target type.

* `string`:
  * Primitives will be "stringified", e.g. `1` becomes `'1'`
  * Arrays will be joined
  * Objects will be converted by calling `toLocaleString()` or `toString()`, whichever is provided
* `number`
  * A string will be parsed as a number if it contains a valid JavaScript number expression, including signed, floating point and hex numbers. It also includes `Infinity` and `NaN`
  * Empty strings become `0`
  * `true` becomes `1` and `false` becomes `0`
  * `Date` will become a unix timestamp
* `boolean`
  * String `'true'` becomes `true` and string `'false'` becomes `false`.
  * Empty strings become `false`.
  * Any number greater than 0 becomes `true`, all other `false`
* `Array`
  * Strings will be separated by comma in to a string array
  * Other primitives will be wrapped in to an array with a single entry
  * Array-likes (objects with `length` property, e.g. `arguments` and `List`) will be converted 1-to-1 in to "real" arrays
  * Typed arrays and `ArrayBuffer` will be converted in to a number-array with each entry representing one byte.
  * Objects with an `toArray` method will be converted by calling that method.
  * All other objects will turn in to arrays containing the property values in arbitrary order.
* Typed arrays and `ArrayBuffer`
  * Conversion between typed arrays will re-use the same `ArrayBuffer` instance
  * A plain array or array-like will be used to create a new `ArrayBuffer` with each entry interpreted as a number representing 1 byte (via `UInt8ClampedArray`).
* Built-in types
  * Boxed (wrapper) types like `Number` can not be created, the result will always be the respective primitive.
  * `Blob` instances can be created from strings, typed arrays and `ArrayBuffer`.
  * `Date` instances are created by interpreting the value as a number representing a unix timestamp.
  * Tabris data-types are created using their respective `from()` method, e.g. `Color.from()`.

Additional strategies:
* Object to primitive
  * If an arrow function is supposed to be converted to primitive it will simply be called and the result will be used if it has the expected type.
  * An array can be converted to a primitive if it contains a single value of the desired type, or if the target type is `string`.
  * If the object provides a `valueOf()` implementation, this method will be called.
  * Lastly, if the object has a  `value` property containing a primitive, that value will be used.
* Primitive to object
  * If the target object type provides a static `from()` method it may well be called to convert the value. It needs to take exactly one parameter and return the expected type. If the type does not match or the method throws an exception, the setter will throw.
  * For conversions from string to object a static `parse()` method will be used over `from()` if available.
  * As a last resort, if no other conversion strategy is found, the constructor of the target type will be called with the incoming value as the sole argument. For this to work the constructor must have one or more parameters.
