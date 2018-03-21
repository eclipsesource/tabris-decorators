# TypeScript Decorators for Tabris.js

This module provides [TypeScript decorators](http://www.typescriptlang.org/docs/handbook/decorators.html) to use with [Tabris.js](http://tabrisjs.com). Below you find a description of the various decorators available. Have a look at the unit tests for examples and edge cases.

## Setup

TODOC

## Data Binding

### @component

Makes the decorated widget class the base reference for databinding. Also, a widget class decorated with `@component` will not allow its own children to be selected by any of its parents, preventing accidental manipulation due to clashing `id` or `class` values. The class itself can still select its own children using the protected methods `_children`, `_find` and `_apply`, or by using the finder/getter decorators above.

For ONE-WAY bindings, `@component` enables a new JSX attribute prefix 'bind, which actively copies values FROM the decorated widget TO the JSX element.

Example:

```js
  @component
  class CustomComponent extends Composite {

    @property public myText: string = 'foo';

    constructor(properties: CompositeProperties) {
      super(properties);
      this.append(
        <textView bind-text='myText'/>
      );
    }

  }
```

This makes changes to `myText` be applied to the `text` property of the `textView` element. The source must be a proper Tabris.js style property, not just a field. This can be achieved simply by adding a `@property` decorator, but a custom implementation also works as long as appropriate change events are fired. The bindings are resolved when append is called the first time. Appending/detaching widgets after that has no effect. If the target property is implemented in TypeScript it should also be using  `@property`, otherwise type safety can not be guaranteed.

### @property

Makes the decorated widget property a "real" Tabris.js property, meaning it can be set via constructor or `set` method (proper type declarations assumed), and it fires change events. This is especially useful when the property is supposed to be the source of a one-way data binding.

### @bind("#\<id\>.\<property\>")

Binds the decorated property of a widget to the property of a child. As with `@getById`, the binding is established after `append` is called the first time on the widget, there needs to be exactly one child with the given id, and it has to have a property of the same type.

`@bind` creates a TWO-WAY binding, meaning changes to the source/child widget property are not just reflected on the decorated property, but also the other way around. Change events are fired for the decorated property if (and only if) the source/child widget fires change events. Only one `@bind` decorator can be applied to any given property. It also implies `@property`, only one of the two can be applied to the same property.

`@bind` only works on classes decorated with `@component`.

### @getById

Lets the property return the descendant with the same id as the property name. The following rules apply:

 * It can only be applied on widget classes that (directly or indirectly) extend `Composite`.
 * It will search for a matching child exactly once, after `append` is called the first time on the widget instance.
 * It will always return the same child, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

`getById` only works on classes decorated with `@component`.

## Dependency Injection

`@inject` together with `@injectable` and others allow for simple dependency injection. The type of the injection has to be a class, interfaces are not supported. However, abstract classes work, and classes can be used like interfaces in TypeScript, so most cases should be covered.

### @inject

Decorate a constructor parameter to inject a value based on the type of the parameter, e.g.:

```js
class Foo {

  constructor(@inject a: ClassA) {
    ...
  }

}
```

### @injectable

Apply this to a class to register it for injection. It can be injected as itself or as any of it's super-classes (except "Object").

```js
class Foo {}
@injectable class Foo2 extends Foo {}


Class Bar() {

  @inject foo2: Foo2; // This will be an instance of `Foo2`
  @inject foo: Foo; // This will also be an instance of `Foo2`

}

```

The injectable class (`Foo2`) may also have injection dependencies itself. For every injection a new instance will be created. If you want to share a single instance for all injections, use `@injectable({shared: true})` instead.

### @injectable({shared?: boolean, implements?: Class})

Like `@injectable`, but with more options:

If `shared` is `true`, all injections of the class will use the same instance. This makes the class effectively a singleton.

If `implements` is a (compatible) class, the decorated class can be injected as an instance of that class, even though it's using a different constructor/prototype. That allows, for example, using abstract classes to define an interface to be injected - without the fulfilling class having to inherit from that abstract class.

### @shared

Shorthand for `@injectable({shared: true})`.

### @injectionHandler

Registers the decorated static method to handle injections for the given type directly. The method must return a value compatible to the given type.

// TDB: Injection parameter object

### injector.resolve(type)

Returns an instance of the given type, just like using the `@inject` decorator would do. Useful in cases where a decorator can not be used, e.g. outside of classes. Note that `type` *has to be an injectable*.

### injector.create(type)

Creates an instance of the given type and fulfils all the constructor injections. *The type itself does not have to be (and typically isn't) injectable*.

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
