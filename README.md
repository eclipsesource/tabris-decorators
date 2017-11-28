# TypeScript Decorators for Tabris.js

This module provides [TypeScript decorators](http://www.typescriptlang.org/docs/handbook/decorators.html) to use with [Tabris.js](http://tabrisjs.com). Below you find a description of the various decorators available. Have a look at the unit tests for examples and edge cases.

## Setup

TODOC

## property modifiers

### @property

Makes the decorated widget property a "real" Tabris.js property, meaning it can be set via constructor or `set` method, and it fires change events.

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

Decorating a widget property declaration with this will make it return the _current_ first descendant matching the given selector, or null. The type of the property is also be part of the matcher, so the result is guaranteed to be of the correct type.

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

## Data Binding

### @bind("#\<id\>.\<property\>")

Binds the decorated property of a widget to the property of a child. As with `@getById`, the binding is established after `append` is called the first time on the widget, there needs to be exactly one child with the given id, and it has to have a property of the same type.

`@bind` creates a bi-directional binding, meaning changes to the source/child widget property are not just reflected on the decorated property, but also the other way around. Change events are fired for the decorated property if (and only if) the source/child widget fires change events.

### @bindTo("#\<id\>.\<property\>")

Like `@bind`, but creates a one-way binding, meaning changes to the source/child widget property are reflected on the decorated property, but setting the decorated property has no effect. This should be used on `readOnly` properties.

## Injectors

The `inject` decorators allow for simple dependency injection. The type of the injection has to be a class, interfaces are not supported. However, classes can be used like interfaces in TypeScript, so most cases should be covered.

### @inject

Decorate a property to inject a value based on the type of the property, e.g.:

```js
class Foo {

  @inject public readonly propA: classA;

}
```

You can also decorate a constructor parameter, like this:

```js
class Foo {

  constructor(@inject a: ClassA) {
    ...
  }

}
```

### @inject(param)

Like `inject`, but the `param` string will be passed to the injection handler.

### @injectable

Apply this to a class to register it for injection. This causes a one-to-one relationship between dependency and injection:

```js
class Foo {}
@injectable class Foo2 extends Foo {}


Class Bar() {

  @inject foo2: Foo2; // This will be an instance of `Foo2`
  @inject foo: Foo; // This will fail, even though `Foo2` would be a valid injection.

}

```

The injectable class (`Foo2`) may also have injection dependencies itself. For every injection a new instance will be created. If you want to share a single instance for all injections, use `@injectable(shared)` instead. If you want to inject an instance of another (compatible) class other than the one requested by the injection, use `injector.addHandler` instead.

### @injectable(shared)

Like `@injectable`, but if `shared` is `true`, all injections of the class will use the same instance. This makes the class effectively a singleton.

### injector.addHandler(targetType, handler)

Allows you to register custom injection handlers, an alternative to using `@injectable`. You do that like this:

```js
import {injector} from 'tabris-decorators';

injector.addHandler(TypeToInject, (param: string | undefined) => {
  return new ExtendingTypeToInject();
});
```

Or, if the class that is created uses injection itself, like this:

```js
import {injector} from 'tabris-decorators';

injector.addHandler(TypeToInject, (param: string | undefined) => {
  return injector.create(ExtendingTypeToInject);
});
```

Where `ExtendingTypeToInject` needs to be compatible to TypeToInject. This is guaranteed to be the case if `SomeType` IS `TypeToInject`, extends `TypeToInject`, implements it as an interface, or simply has the same structure. The IDE will warn you if they aren't compatible.

A  `param` will be given to the injection handler only if the `@inject(param)` decorator is used, or if `inject(type, param)` is called.

Primitives can also be injected. They are represented by their boxed Types, e.g. `injector.addHandler(Number, () => 23);`.

Whether the return value is always the same (i.e. singleton), always different, or depending on `param` is not relevant to the framework. The value is not checked at runtime in any way.

Already registered injection handler can be removed/replaced if they have not be used yet be the framework.

### injector.resolve(type)

Returns an instance of the given type, just like using the `@inject` decorator would do. Useful in cases where a decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*.

### injector.resolve(type, param)

Like `injector.resolve(type)`, but the `param` string will be passed to the injection handler.

### injector.create(type)

Creates an instance of the given type and fulfils all this injection it defines. *The type itself does not have to be injectable*. You can use this to *make* the type  injectable via injection handler:

```js
injectionHandlers.add(TypeToInject, () => create(SomeType));
```

Used in these manner, `SomeType` can be injected while also having injections itself. If `TypeToInject` is identical to `SomeType`, this is the same as using `@injectable`.

### injector.create(type, param[])

Like `create(type)`, but any parameters not decorated with `inject` will be taken from the given array, with the index in the array matching that of the parameter. For example:

```js
class Foo {

  constructor(@inject a: ClassA, b: ClassB, @inject c: ClassC) {
    ...
  }

}

let foo = create(Foo, [undefined, new ClassB(), new ClassC()]);
```

This will inject `a` and `c`, while `b` is taken from the given array. The instance of `ClassC` in the array will be ignored.
