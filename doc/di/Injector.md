---
---
# Injector

> :point_right: Make sure to first read the [introduction to dependency injection](./index.md) and the [`@inject`](./@inject.md) documentation.

All injection handler created by `@injectable`, `@shared` and `@injectionHandler` are registered in a global `Injector` instance exported as `injector`.

## create(type, ...parameters)

Where `type` can be any class and `parameters` (optional) are of the same type as the constructor parameters.

Creates an instance of the given type and fulfils all the constructor injections. *The type itself does not have to be injectable*. If it was the `resolve` method should be used instead. If parameters are given after the type they will be passed to the constructor, while all other constructor parameters will be injected (if decorated with [`@inject`](./@inject.md)).

Example:

```ts
class Foo {

  constructor(a: ClassA, @inject b: ClassB, @inject c: ClassC) {
    //...
  }

}

let foo = create(Foo, new ClassA());
```

The `create` method of the default global injector instance is also exported directly by `'tabris-decorators'`:

```ts
import {injector, create} from 'tabris-decorators';

console.log(injector.create === create);
```

## resolve(type, injectionParameter?)

Where `type` can be any class and `injectionParameter` of any type.

Returns an instance for the given type, just like using the `@inject` decorator would do in a constructor. Especially useful in cases where the `@inject` decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*, i.e. have a compatible injection handler registered. The second parameter may be omitted, or be used to pass a value to the injection handler. For further information see [`@injectable(config)`](./@injectable.md) and [`@injectionHandler(type)`](./@injectionHandler.md).

The `resolve` method of the default global injector instance is also exported directly by `'tabris-decorators'`:

```ts
import {injector, resolve} from 'tabris-decorators';

console.log(injector.resolve === resolve);
```

## addHandler({targetType, handler, priority?})

Where `targetType` is any class, `handler` is a Function returning a `targetType` instance and priority - if given - is a `number`.

Explicitly registers a new injection handler for `targetType` Same as using the [`injectionHandler`](./@injectionHandler.md) decorator attached to the same `Injector` instance.

## addHandler(targetType, handler)

Shorthand for `addHandler({targetType, handler})`.

## Custom Injector instances

For unit tests or libraries it may be useful to create a separate `Injector` instance to keep the registered injection handlers separate.

To use the custom injector in other module, import the decorators/functions not from `tabris-decorators` but from a new module like this one:

```ts
import { Injector } from 'tabris-decorators';

export const injector = new Injector();
export const { inject, shared, injectable, injectionHandler, create, resolve} = injector;
export const JSX = injector.jsxProcessor;
```

Then import like this:
```ts
import { injector, inject, injectable, shared, injectionHandler, JSX } from './customInjector';
```

The `JSX` object must be imported whenever JSX expressions are used that should resolve injections with the given injector.

The Injector instance that was used to create a given object may be obtained by `Injector.get(object)`. That is necessary if an object needs an injector instance (e.g. for calling `injector.create()`), but may be created by different injectors in different scenarios, for example in unit testing.

Example:

```js
const newObject = Injector.get(this).create(InjectableType);
```
