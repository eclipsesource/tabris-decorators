# TypeScript Decorators for Tabris.js

This module provides [TypeScript decorators](http://www.typescriptlang.org/docs/handbook/decorators.html) to use with [Tabris.js](http://tabrisjs.com). Below you find a description of the various decorators available. Have a look at the unit tests for examples and edge cases.

## Setup

TODOC

## Data Binding

### @component

Makes the decorated widget class the base reference for databinding. Also, a widget class decorated with `@component` will not allow its own children to be selected by any of its parents, preventing accidental manipulation due to clashing `id` or `class` values. The class itself can still select its own children using the protected methods `_children`, `_find` and `_apply`, or by using `@getById` on a private/protected property.

For ONE-WAY bindings, `@component` enables a new JSX attribute prefix 'bind', which actively copies values FROM the base component TO the JSX element.

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

This makes changes to `myText` be applied to the `text` property of the `textView` element. The source must be a proper Tabris.js style property, not just a field. This can be achieved simply by adding a `@property` decorator, but a custom implementation also works as long as appropriate change events are fired. The bindings are resolved when append is called the first time. Appending/detaching widgets after that has no effect. If the target property is implemented in TypeScript it should ideally also be using `@property`, otherwise type safety can not be guaranteed (see below).

### @property

Makes the decorated widget property a "real" Tabris.js property, meaning it can be set via constructor or `set` method (proper type declarations assumed), and it fires change events. This is especially useful when the property is supposed to be the source of a one-way data binding. It also performs type checks for the databinding system. It works on any class extending `Widget`.

### @property(value => boolean)

Like `@property`, but uses the given function (type guard) to perform type checks. The type guard may be more strict than the TypeScript compiler (e.g. allowing only positive numbers where the compiler allows any number), but should never be less strict, though it is possible.

The function may return either a boolean (`true` indicates the value passes), or throw an error explaining why the value did not pass.

Example:

```js
  @component
  class CustomComponent extends Composite {

    @property(v => v instanceof Array || (!isNaN(v) && v >= 0))
    public mixedType: number[] | number = 0;

  }
```

### @bind({path: "#\<id\>.\<property\>", typeGuard?: value => boolean})

Binds the decorated property of a widget to the property of a child. As with `@getById`, the binding is established after `append` is called the first time on the widget, there needs to be exactly one child with the given id, and it has to have a property of the same type.

`@bind` creates a TWO-WAY binding, meaning changes to the source/child widget property are not just reflected on the decorated property, but also the other way around. Change events are fired for the decorated property if (and only if) the source/child widget fires change events. Only one `@bind` decorator can be applied to any given property. It also implies `@property` and includes it's typeGuard feature. Only one of the two can be applied to the same property.

`@bind` only works on classes decorated with `@component`.

### @bind(path: string)

Shorthand for `@bind({path: path})`

### @getById

Lets the property return the descendant with the same id as the property name. The following rules apply:

 * It only works on classes decorated with `@component`.
 * It is read-only at runtime. Attempts to set the property fill fail silently.
 * It will search for a matching child exactly once, after `append` is called the first time on the widget instance.
 * If accessed before children have been appended it will throw an error.
 * It will always return the same child, even if it is disposed or removed.
 * It will throw if there is no match, more than one, or if the type is not correct.

### Notes on type safety

Since the databinding system can not rely on IDE tooling to ensure type safety, runtime checks are performed. This causes some limitations:

* For properties that have a class or primitive type, type checks will be performed.
* Properties that have a pure string or number enum/union type are treated like they are a string or number primitive type. It's therefore possible to bind a string enum or union to another string enum/union or string primitive. Same for number. **This should be avoided** unless it's a one-way binding where the enum/union property is on the base component, and the primitive type on the target component.
* If either property type is any other [advanced type](http://www.typescriptlang.org/docs/handbook/advanced-types.html) or an interface, the binding will fail.
* If both properties are missing type information, no type checks will be performed. Type information are missing if the property is not decorated (e.g. with @property) or implemented in JavaScript. **In this case it is expected that the property setter performs type checks itself.** This is the behavior of all Tabris.js built-in widgets.


## Dependency Injection

`@inject` together with `@injectable` allow for simple dependency injection. The type of the injection has to be a class, interfaces are not supported. However, abstract classes and classes merged with interfaces work. Since classes can be used like interfaces in TypeScript most cases should be covered.

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

Registers the decorated static method to handle injections for the given type directly. The method must return a value compatible to the given type or `null`/`undefined`. If no compatible value is returned the next injection handler is called. If no injection handler returns a compatible value the injection fails. (`@injectable` counts as an injection handler.)

// TDB: Injection parameter object

### injector.resolve(type)

Returns an instance of the given type, just like using the `@inject` decorator would do. Useful in cases where a decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*.

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
