# Dependency Injection

`@inject` together with `@injectable` allow for simple dependency injection. The type of the injection has to be a class, interfaces are not supported. However, abstract classes and classes merged with interfaces work. Since classes can be used like interfaces in TypeScript most cases should be covered.

## Decorators

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

If `implements` is a (compatible) class, the decorated class can be injected as an instance of that class, despite having a different constructor/prototype. That allows using abstract classes as interfaces.

### @shared

Shorthand for `@injectable({shared: true})`.

### @injectionHandler

Registers the decorated static method to handle injections for the given type directly. The method must return a value compatible to the given type or `null`/`undefined`. If no compatible value is returned the next injection handler is called. If no injection handler returns a compatible value the injection fails. (`@injectable` counts as an injection handler.)

## Injector class

All injection handler created by `@injectable`, `@shared` and `@injectionHandler` are manages in an `Injector` instance. The global decorators exported directly by `tabris-decorators` belong to a global (i.e. singleton) `Injector` instance exported as `injector`. You will need that instance as an entry point to create the very first injection via its `resolve` or `create` methods.

Usually there is no need to create your own to create your own instance of `Injector`, but it may be useful for unit testing or when writing libraries targeting Tabris.js. This is explained below.

### injector.resolve(type)

Returns an instance of the given type, just like using the `@inject` decorator would do. Especially useful in cases where a `@inject` decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*.

The `resolve` method is permanently bound its `injector`, therefore you can also your it separately like this:

```js
const {resolve} = injector;

let myInstance = resolve(MyType);
```

### injector.create(type)

Creates an instance of the given type and fulfils all the constructor injections. *The type itself does not have to be (and typically isn't) injectable*.

Like `resolve`, this method is permanently bound its `injector`:

```js
const {resolve, create} = injector;
```


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

## JSX and Dependency Injection

Injections on widgets created via JSX are automatically resolved using the global injector. However, the first constructor parameter can not be used for injection, it will always be the `properties` object defined via the JSX attributes.

When using your own `Injector` instance you will need to put its `JSX` object in to the module scope where you use your JSX expressions. See next chapter:

## Creating your own Injector instance

Create a new module (e.g. `customInjector.ts`) that looks like this:

```js
import { Injector } from 'tabris-decorators';

export const injector = new Injector();
export const { inject, shared, injectable, injectionHandler, create, resolve, JSX } = new Injector();
```

To use the injector instance within another module instead of the global one, import the decorators from `./customInjector` instead of `tabris-decorators`. You also need to import `JSX` if you use JSX expressions.

```js
import { injector, inject, injectable, shared, injectionHandler, JSX } from './customInjector';
```

Technically `inject` can be used from the custom injector or from `tabris-decorators`. It's available on `injector` for convenience.