# tabris-decorators

## TypeScript Decorators for Tabris.js

This module provides [TypeScript decorators](http://www.typescriptlang.org/docs/handbook/decorators.html) to with [Tabris.js](http://tabrisjs.com). Below you find a description of the various decorators available. Have a look at the unit tests for examples and edge cases.

### findFirst(selector)

Decorating a widget property declaration with this will make it return the first child matching the given selector, or null. The type of the property will be become part of the matcher, so the result is guarenteed to be of the correct type.

> :exclamation: If the property type can not be inferred, this decorator will throw an error when parsing the class. This may be the case for for a type like "`Composite | null`", which you may want to use  if the TypeScript [compiler option "strictNullChecks"](https://www.typescriptlang.org/docs/handbook/basic-types.html#null-and-undefined) (or "strict") is enabled. In this case you should use the decorator `findFirst(WidgetType, selector)`.

### findFirst(WidgetType, selector)

Decorating a widget property declaration with this will make it return the first child matching the given type and selector, or null. The actual type of the property will not be considered, so make sure that `WidgetType` is assignable to the property type.
