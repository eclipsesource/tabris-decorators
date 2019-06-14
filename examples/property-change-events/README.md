# Example "property-change-events"

Demonstrates that properties decorated with `@property` trigger property change events on the target object. This app provides a UI to change the `name` and `age` properties (on button press) of an instance of the class `Person`. Doing so logs the changes in a on-screen label and in the developer console.

Both `Person` properties are decorated with `@property` and have a matching `ChangeListeners` field. E.g. `age` is a property of the type `number` and `onAgeChanged` is of the type `ChangeListeners<Person, 'age'>`, indicating that it fires change events for the `age` property of `Person`. When the value of `age` is changed `@property` looks for `onAgeChanged` by name (`on`, followed by the upper case property name, followed by `Changed`) and triggers a matching change event.

The `@event` decorator only creates the actual `ChangeListeners` instance, it is not required. The line
```ts
@event public onAgeChanged: ChangeListeners<Person, 'age'>;
```
could be replaced with:
```ts
public onAgeChanged: ChangeListeners<Person, 'age'> = new ChangeListeners(this, 'age');`
```
