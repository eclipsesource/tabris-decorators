---
---
# @prop

An alias for [`@property`](./@property.md), except that it has "smarter" default options and a different shorthand parameter. It's generally recommended over `@property` for custom component development, but its default behavior may be unexpected for newcomers.

## @prop (no parameter)

The following table shows how `@prop` differs in its default configuration from `@property`:

Option      | @property  | @prop
------------|------------|--------
`type`      | not set    | not set
`typeGuard` | not set    | not set
`default`   | not set    | not set
`nullable`  | true       | false
`equals`    | `'strict'` | `'auto'`
`convert`   | `'off'`    | `'auto'`


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
