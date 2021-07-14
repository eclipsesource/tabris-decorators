---
---
# @prop

An alias for [`@property`](./@property.md), except that it has "smarter" default options and a different shorthand parameter. It's generally recommended over `@property` for custom component development, but its default behavior may be unexpected for newcomers:

* The initial value is not `undefined` but depends on the type (see next section).
* All values will be automatically converted to the expected type (if possible).
* The property can not contain a plain object, but a plain object may be set if it can be converted to the type of the property.
* If set to `null` or `undefined` the property is reset to its initial value. If the initial value is also `null` (which is the default for non-primitives) an exception is thrown.
* If the property contains an array and is set to another array that is shallow-equal (has the same length and entries), the property will keep the current value.
* If used in a JavaScript file (or if the type can not be inferred at runtime in a TypeScript file), the type of the property must be given via `@prop(Class)` or `@prop({type: Class})`, where `Class` may also be `Number`, `String` or `Boolean` to represent primitives. Without type information a warning will be printed the property and all type-specific features (conversion, initial value, type checks) will be disabled.

For details follow the links in the table below.

## @prop (no parameter)

The following table shows how `@prop` differs in its default configuration from `@property`:

Option      | @property  | @prop
------------|------------|--------
[`type`](./@property.md#configtype)      | not set    | not set
[`typeGuard`](./@property.md#configtypeguard) | not set    | not set
[`default`](./@property.md#configdefault)   | not set    | depends on type*
[`nullable`](./@property.md#confignullable)  | true       | depends on type**
[`equals`](./@property.md#configequals)    | `'strict'` | `'auto'`
[`convert`](./@property.md#configconvert)   | `'off'`    | `'auto'`

*) The default is `''` (empty string) for strings, `0` for numbers, `false` for booleans and `null` for all other types.
*) `nullable` is `false` only for primitive types (number, boolean, string and subsets thereof).

## @prop(type)

A shorthand for `@prop({type: type})`.

Examples:

```ts
@prop(Color)
color: ColorValue;

/** @type {string} */
@prop(String) str;
```

## @prop(config)

Like `@prop`, but allows to override the default values just like with [`@property`](./@property.md#propertyconfig).
