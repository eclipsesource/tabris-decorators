# Example "property-change-events"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=property-change-events/https://github.com/eclipsesource/tabris-decorators/tree/gplink/examples/property-change-events)

## Description

Note: A JavaScript/JSX variant of the this TypeScript/JSX example can be found [here](../property-change-events-jsx).

Demonstrates that properties decorated with `@property` trigger property change events on the target object. This app provides a UI to change the `age` and `firstName` properties (on button press) of instances of the `Person` and `Name` classes, respectively. Doing so logs the changes in a on-screen label and in the developer console.

The `Person` properties `age` and `name` are decorated with `@property` and have matching `ChangeListeners` fields. E.g. `age` is a property of the type `number` and `onAgeChanged` is of the type `ChangeListeners<Person, 'age'>`, indicating that it fires change events for the `age` property of `Person`. When the value of `age` is changed, `@property` looks for `onAgeChanged` by name (`on`, followed by the upper case property name, followed by `Changed`) and triggers a matching change event.

The decorator for `name` is configured with `observe: true`. This makes it emit `nameChanged` events in case any properties of the assigned `Name` instance changes. Otherwise only replacing the entire `name` object would trigger `nameChanged` events. (You could also use `@prop`, which has `observe` enabled by default.)

The `@event` decorator only creates the actual `ChangeListeners` instance, it is not required. The line
```ts
@event onAgeChanged: ChangeListeners<Person, 'age'>;
```
could be replaced with:
```ts
onAgeChanged: ChangeListeners<Person, 'age'> = new ChangeListeners(this, 'age');
```
