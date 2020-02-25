# Example "property-value-checks-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=property-value-checks-jsx/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/property-value-checks-jsx)

## Description

Note: This is the JavaScript/JSX variant of the [property-value-checks](../property-value-checks) TypeScript/JSX example.

Demonstrates how `@property` can be used with type guards to narrow down the accepted values more than the `type` options allows. This app provides a UI to change the `name` and `age` properties (on button press) of an instance of the class `Person`. Doing so only works if the age is a positive number and if the name has at least two characters.

The `age` property has only one parameter - the type guard function. This is actually a shorthand for `@property({typeGuard: isPositiveNumber})`. The type guard function takes one argument and should return a boolean indicating whether the value is accepted or not. In this case the type guards only allows finite positive numbers:

```ts
function isPositiveNumber(value) {
  return value > 0 && isFinite(value) && !isNaN(value);
}
```

The `name` property demonstrates combining the `typeGuard` option with `type`. By also declaring the type to be a string (represented by the `String` constructor), the type guard can expect the given value to always be a string (or `null`).

Note that the `hasMinLength` function is technically not itself a type guard, but instead creates one depending on the `length` parameter. This also demonstrates the type guards can throw an error with a message to indicate why a value was rejected.
