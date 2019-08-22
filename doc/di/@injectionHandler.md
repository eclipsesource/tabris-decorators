---
---
# @injectionHandler

> :point_right: Make sure to first read the [introduction to dependency injection](./index.md)  and the [`@inject`](./@inject.md) documentation.

Registers a method as an injection handler, allowing it to fulfill injections explicitly. It is essentially a more powerful alternative to [`@injectable`](./@injectable.md).

## @injectionHandler(targetType)

Where `targetType` can be any class.

May be applied to a **static** method to handle injections for the `targetType` directly. The method return a value compatible to the given type or `null`/`undefined` to leave the injection unhandled. The method is also passed an `Injection` object of the following type:
```ts
{
  type: Class,
  injector: Injector,
  param: object | string | number | boolean | null
}
```

Where...
* `type` is the exact type that was requested. May be identical to the type parameter of the decorator, or another compatible class.
* `injector` is the [`Injector`](./Injector.md) instance the injection handler is registered with. May be used to create or resolve other objects.
* `param` is an injection parameter that may have been passed via [`@inject(param)`](./@inject.md) or [`resolve(type, param)`](./Injector.md).

Example:

```ts
import {injectionHandler, Injection} from 'tabris-decorators';

class MyInjectionHandler {

  @injectionHandler(Foo)
  static handleInjection(injection: Injection) {
    return new Foo();
  }

}
```

If no compatible value is returned the next injection handler is called. If no injection handler returns a compatible value the injection fails. (`@injectable` implicitly creates an injection handler.) A single class may hold any number of injection handler methods. The name of an injection handler methods is not relevant.

## @injectionHandler({targetType, priority?})

Where `targetType` can be any class and priority - if given - has to be a `number`.

Like `@injectionHandler(targetType)`, but allows to give a priority, just like [`@injectable({priority})`](./@injectable.md). The priority controls in which order injection handlers for the same target type are called, with the highest priority handler being called first.
