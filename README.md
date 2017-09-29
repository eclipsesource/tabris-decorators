# TypeScript Decorators for Tabris.js

This module provides [TypeScript decorators](http://www.typescriptlang.org/docs/handbook/decorators.html) to use with [Tabris.js](http://tabrisjs.com). Below you find a description of the various decorators available. Have a look at the unit tests for examples and edge cases.

## Setup

TODOC

## widget finders

These decorators are meant to be attached to properties of custom UI components and will make them return specific descendants of that widget. For example:

```js
class CustomComponent extends Composite {

  @findFirst('.bar')
  private readonly firstBar: Composite;

  constructor() {
    super();
    this.append(
      new Composite({class: 'foo'}),
      new Composite({class: 'bar'}), // firstBar will return this widget
      new Composite({class: 'bar'})
    );
  }

}
```
> :exclamation: The finder  decorators that do not take a widget type as the first argument will infer the type from the property type. If the property type can not be inferred, the  decorator will throw an error when parsing the class. This may be the case for for a type like "`Composite | null`", which you may want to use  if the TypeScript [compiler option "strictNullChecks"](https://www.typescriptlang.org/docs/handbook/basic-types.html#null-and-undefined) (or "strict") is enabled. In this case you should use the decorators that do take the widget type as an argument.

### @findFirst

Decorating a widget property declaration with this will make it return the _current_ first descendant matching the property type, or null.

This is the equivalent of:

```js
get someChild(): WidgetType {
  return this.find('*').first(WidgetType) || null;
}
```

### @findFirst(selector)

Decorating a widget property declaration with this will make it return the _current_ first descendant matching the given selector, or null. The type of the property is also be part of the matcher, so the result is guarenteed to be of the correct type.

This is the equivalent of:

```js
get someChild(): WidgetType {
  return this.find(selector).first(WidgetType) || null;
}
```

### @findFirst(WidgetType)

Decorating a widget property declaration with this will make it return the _current_ first descendant matching the given type, or null. The actual type of the property will not be considered, so make sure that `WidgetType` is assignable to the property type.

This is the equivalent of:

```js
get someChild(): any {
  return this.find('*').first(WidgetType) || null;
}
```

### @findFirst(WidgetType, selector)

Decorating a widget property declaration with this will make it return the _current_ first descendant matching the given type and selector, or null. The actual type of the property will not be considered, so make sure that `WidgetType` is assignable to the property type.

This is the equivalent of:

```js
get someChild(): any {
  return this.find('*').first(WidgetType) || null;
}
```
### @findLast

Like `@findFirst`, only returning the last found widget instead:

### @findLast(selector)

Like `@findFirst(selector)`, only returning the last found widget instead:

### @findLast(WidgetType)

Like `@findFirst(WidgetType)`, only returning the last found widget instead.

### @findLast(WidgetType, selector)

Like `@findFirst(WidgetType, selector)`, only returning the last found widget instead.

### @findAll(WidgetType)

Lets the property return an instance of `WidgetCollection` with all descendants matching the given type. If the property type is a parameterized collection (e.g. `WidgetCollection<Composite>), it is the developers responsibility to ensure that the parameter matches the type given in the decorator.

```js
get someChildren(): any {
  return this.find('*').filter(WidgetType);
}
```

### @findAll(WidgetType, selector)

Lets the property return an instance of `WidgetCollection` with all descendants matching the given type and selector. If the property type is a parameterized collection (e.g. `WidgetCollection<Composite>), it is the developers responsibility to ensure that the parameter matches the type given in the decorator.

```js
get someChildren(): any {
  return this.find(selector).filter(WidgetType);
}
```

## widget getters

### @getById

Lets the property return the descendant with the same id as the property name. Unlike the finder decorators, `getById` is very strict.

 * It can only be applied on widget classes that (directly or indirectly) extend `Composite`.
 * It will search for a matching child exactly once, after `append` is called the first time on the widget instance.
 * It will always return the same child, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

### @getByType

Like `@getById`, but ignored the id and looks by return type only. Useful if there is only one widget of a specific type in your widget tree anyway, so you don't have to assign it an id.

## Injectors

The `inject` decorators allow for simple dependency injection. The main difference to most dependency injection libraries in high-level languages is that these use classes to define the type of the injection, not interfaces. However, since classes can be used like interfaces in TypeScript, nothing really changes.

Before you can use the injectors, you have to register injection handlers for each type. You do this like this:

```js
import {injectionHandlers} from 'tabris-decorators';

injectionHandlers.add(TypeToInject, (param: string | undefined) => {
  return new SomeType();
});
```

Where `SomeType` needs to be compatible to TypeToInject. This is guarenteed to be the case if `SomeType` IS `TypeToInject`, extends `TypeToInject`, implements it as an interface, or simply has the same structure. The IDE will warn you if they aren't compatible.

A  `param` will be given to the injection handler only if the `@inject(param)` decorator is used, or if `inject(type, param)` is called.

Primitives can also be injected. They are represented by their boxed Types, e.g. `injectionHandlers.add(Number, () => 23);`.

Whether the return value is always the same (i.e. singleton), always different, or depending on `param` is not relevant to the framework. The value is not checked at runtime in any way.

Injection handler can be removed/replaced if they have not be used yet be the framework.

### @inject

Decorate a property to inject a value based on the type of the property, e.g.:

```js
class Foo {

  @inject public readonly aNumber: number;

}
```

The value is resolved lazily, so the first time the property is accessed on each instance. The result is cached, so the value will never change during the lifecycle of the object, nor can it be set.

### @inject(param)

Like `inject`, but the `param` string will be passed to the injection handler.

### inject(type)

This is not a decorator, but a simple utility to call the injection framework directly. This may be useful when used with parameters, e.g.:

```js
new SomeWidget({
  service: inject(MyService)
});
```

### inject(type, param)

Like `inject(type)`, only that `param` will be passed to the injection handler.

## initializers

These property decorators are to be used with the `initialize(target, source)` function, where target is an instance of a class using the decorators, and source is any plain object. All properties decorated with these will be initialized with values from "source". If the data in `source` is not suitable to initialize `target`, `initialize` will throw.

Example usage:

```js
let myModel = initialize(new MyModel(), JSON.parse(fetchedData));
```

Or:

```js
class MyModel {

  @required public name: string;
  @optional(NaN) public age: number;

  constructor(sourceData: object) {
    initialize(this, sourceData);
  }

}
```

The same target can not be initialized twice, even if the first initialization failed. Before initialization none of the properties can be accessed (will throw). Only properties of primitive or class-types can be initialized. *Generics will not be checked.*

There are also some options that can be set via a third parameter:

```
initialize(target, source, {
  strict: true // lets the initialization fail if there are properties in "source" that are missing in "target".
  deep: true: // will automatically construct new instancse of non-primitive target values using the source value
});
```

The `deep` flag changs the behavior if the target and sources property have different types. Usually `initialize` would just stop and throw in such a scenario. But in "deep" mode it will create a new instance of the target type and give the source value as a parameter to the constructor. Of course this requires the constructor to be able to handle that parameter type, which is not checked in any way.

Example:

```
class Model {
  constructor(data: any) {
    initialize(this, data, {deep: true}));
  }
}

class Door extends Model{
  @required public open: boolean;
}

class House extends Model {
  @required public door: Door;
}

let houseJson = '{door: {open: true}}';
let house = new House(JSON.parse(houseJson));

```

There are no recursion checks, so if types are (indirectly) depending on themselvs it will produce a stack overflow.

### @required

Marks this property as required for initialization. If the source does not contain an entry of the correct type, initialization will fail.

### @required(processor)

Marks this property as required for initialization. Before the source value type is checked the processor function will be called. It can either return the value as is, return a different value, or throw to reject the value.

### @optional(fallback)

Marks this property as optional for initialization. If the source does not contain an entry for this property, the `fallback` value will be set. If the source has an entry, but is of the wrong type, initialization will still fail.

### @optional(fallback, processor)

Marks this property as optional for initialization. If the source does not contain an entry for this property, the `fallback` value will be given to the processor. Otherwise it works like `required(processor)`.
