# Dependency Injection

`@inject` together with `@injectable` allow for simple [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) ("DI"). The type of the injection has to be a class, interfaces are not supported. However, abstract classes and classes merged with interfaces work. Since classes can be used like interfaces most traditional dependency injection patterns should still work. Primitives are (theoretically) also supported, but [advanced types](http://www.typescriptlang.org/docs/handbook/advanced-types.html) are not.

## @inject

Decorate a constructor parameter to inject a value based on the type of the parameter, e.g.:

```ts
class Foo {

  constructor(@inject a: ClassA) {
    ...
  }

}
```

## @inject(param: InjectionParameter)

Like `@inject`, but allows to pass pass on a value (any object, string, number or boolean) to the injection handler. For further information see `@injectable(config: InjectableConfig)` and `@injectionHandler(type: Class)`.

```ts
class Foo {

  constructor(@inject('some value') a: ClassA) {
    ...
  }

}
```

## @injectable

Apply this to a class to register it for injection. It can be injected as itself or as any of it's super-classes (except `Object`).

```ts
class Foo {}

@injectable class Foo2 extends Foo {}


Class Bar() {

  constructor(
    @inject private readonly foo2: Foo2; // This will be an instance of Foo2
    @inject private readonly foo: Foo; // This will also be an instance of Foo2
  ) {
    // ...
  }

}

```

The injectable class (`Foo2`) may also have injection dependencies itself. For every injection a new instance will be created. If you want to share a single instance for all injections, use `@injectable({shared: true})` instead.

## @injectable(config: InjectableConfig)

* `config`: `{shared?: boolean, implements?: Class, param: InjectionParameter}`

Like `@injectable`, but with more options.

* If `shared` is `true`, all injections of the class will use the same instance. This makes the class effectively a singleton.

* If `implements` allows the decorated class to be injected as an instance of another (compatible) class, despite having a different constructor/prototype. This works since TypeScript has a [structural type system](http://www.typescriptlang.org/docs/handbook/type-compatibility.html) and allows using (abstract) classes as interfaces.

* If `param` is set the decorated class will only be injected for injections that have the same injection parameter. The parameter may be given via `@inject(param: InjectionParameter)` or `resolve(type: Class, param: InjectionParameter)`. This is really only useful when multiple compatible types are made injectable.

## @shared

Shorthand for `@injectable({shared: true})`.

## @injectionHandler(type: Class)

* `Injection`: `{type: Class, injector: Injector, param: InjectionParameter}`
* `InjectionParameter`: `object | string | number | boolean | null`;

Registers the decorated static method to handle injections for the given type directly. The method is passed an `Injection` object and must return a value compatible to the given type or `null`/`undefined`. If no compatible value is returned the next injection handler is called. If no injection handler returns a compatible value the injection fails. (`@injectable` creates an injection handler.)

The `Injection` object provides the following values:
* `type`: The exact type that was requested. May be identical to the type parameter of the decorator, or another compatible class.
* `injector`: The `Injector` instance the injection handler is registered with. May be used to create or resolve other objects.
* `param`: An injection parameter that may have been passed via `@inject(param: InjectionParameter)` or `resolve(type: Class, param: InjectionParameter)`.

Injection handler may also be registered via the `addInjectionHandler` method on an `Injector` instance.

## resolve(type: Class, injectionParameter?: InjectionParameter)

Returns an instance of the given type, just like using the `@inject` decorator would do in a constructor. Especially useful in cases where a `@inject` decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*, i.e. have a compatible injection handler registered. The second parameter may be omitted, or be used to pass a value to the injection handler. For further information see `@injectable(config: InjectableConfig)` and `@injectionHandler(type: Class)`.

## create(type: Class, ...parameters: any[])

Creates an instance of the given type and fulfils all the constructor injections. *The type itself does not have to be (and typically isn't) injectable*. The parameters given after the type will be passed to the constructor, while every remaining parameter of the constructor will be injected (if decorated with `@inject`).

Example:

```ts
class Foo {

  constructor(a: ClassA, @inject b: ClassB, @inject c: ClassC) {
    //...
  }

}

let foo = create(Foo, new ClassA());
```

## JSX and Dependency Injection

Injections on widgets created via JSX are automatically resolved using the global injector. (This is achieved by replacing the global `JSX` object.) However, the first constructor parameter can not be used for injection, it will always be the `properties` object defined via the JSX attributes.

## Injector class

All injection handler created by `@injectable`, `@shared` and `@injectionHandler` are managed in an `Injector` instance. The DI related decorators and functions exported directly by `tabris-decorators` belong to a global (i.e. singleton) `Injector` instance exported as `injector`, i.e. `injector.injectable === injectable`. It also has the (modified) global `JSX` object that manages injections for JSX expressions attached.

Usually there is no need to create your own instance of `Injector`, but it may be useful for unit testing or when writing libraries targeting Tabris.js.  To do so create a new module (e.g. `customInjector.ts`) that looks like this:

```ts
import { Injector } from 'tabris-decorators';

export const injector = new Injector();
export const { inject, shared, injectable, injectionHandler, create, resolve, JSX } = new Injector();
```
To use the custom injector within another module instead of the global one, import the decorators/functions from `./customInjector` instead of `tabris-decorators`. You also need to import `JSX` if you use JSX expressions.

```ts
import { injector, inject, injectable, shared, injectionHandler, JSX } from './customInjector';
```

The `@inject` decorator - unlike `@injectable`, `@injectionHandler`, etc. - is not bound to any specific injector. Therefore it would technically not need to be available on every `Injector` instance. It is there only for convenience when creating custom injectors as above.
