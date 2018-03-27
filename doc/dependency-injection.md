# Dependency Injection

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
