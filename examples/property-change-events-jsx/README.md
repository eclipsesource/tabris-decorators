# Example "property-change-events-jsx"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=property-change-events-jsx/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/property-change-events-jsx)

## Description

Note: This is a JavaScript/JSX variant of the [property-change-events](../property-change-events) TypeScript/JSX example.

Demonstrates that properties decorated with `@property` trigger property change events on the target object. This app provides a UI to change the `name` and `age` properties (on button press) of an instance of the class `Person`. Doing so logs the changes in a on-screen label and in the developer console.

Both `Person` properties are decorated with `@property` and have a matching `ChangeListeners` field. E.g. `age` is a property of the type `number` and `onAgeChanged` is of the type `ChangeListeners<Person, 'age'>`, indicating that it fires change events for the `age` property of `Person`. When the value of `age` is changed `@property` looks for `onAgeChanged` by name (`on`, followed by the upper case property name, followed by `Changed`) and triggers a matching change event.

The `@event` decorator only creates the actual `ChangeListeners` instance, it is not strictly required. The line
```ts
@event onAgeChanged;
```
could be replaced with:
```ts
onAgeChanged = new ChangeListeners(this, 'age');
```
