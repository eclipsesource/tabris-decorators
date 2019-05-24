---
---
# Injector

> :point_right: Make sure to first read the introduction to [decorators](./decorators.md) and the [`@inject`](./@inject.md) documentation.

All injection handler created by `@injectable`, `@shared` and `@injectionHandler` are managed in a global `Injector` instance exported as `injector`. It provides methods - `create` and `resolve` - for resolving injections, which, like the decorators, are also exported directly from `'tabris-decorators'`:

```ts
import {injector, create, resolve, injectable} from 'tabris-decorators';

console.log(injector.create === create);
console.log(injector.resolve === resolve);
console.log(injector.injectable === injectable);
// etc...
```

## create(type: Class, ...parameters: any[])

Creates an instance of the given type and fulfils all the constructor injections. *The type itself does not have to be (and typically isn't) injectable*. The parameters given after the type will be passed to the constructor, while every remaining parameter of the constructor will be injected (if decorated with [`@inject`](./@inject.md)).

Example:

```ts
class Foo {

  constructor(a: ClassA, @inject b: ClassB, @inject c: ClassC) {
    //...
  }

}

let foo = create(Foo, new ClassA());
```

## resolve(type: Class, injectionParameter?: unknown)

Returns an instance for an injectable type, just like using the `@inject` decorator would do in a constructor. Especially useful in cases where a `@inject` decorator can not be used, e.g. outside of classes. Note that `type` *has to be injectable*, i.e. have a compatible injection handler registered. The second parameter may be omitted, or be used to pass a value to the injection handler. For further information see `@injectable(config: InjectableConfig)` and `@injectionHandler(type: Class)`.


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
