---
---
# @injectionHandler

> :point_right: Make sure to first read the introduction to [decorators](./decorators.md) and the [`@inject`](./@inject.md) documentation.

Registers a method as an injection handler, allowing it to fulfill injections explicitly. It is essentially a more powerful alternative to [`@injectable`](./@injectable.md).

## @injectionHandler(targetType: Class)

May be applied to a **static method** to handle injections for the `targetType` directly. The method is passed an `Injection` object and must return a value compatible to the given type or `null`/`undefined`. If no compatible value is returned the next injection handler is called. If no injection handler returns a compatible value the injection fails. (`@injectable` creates an injection handler.)

The interface of `Injection` is:
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
import {injectionHandler, injection} from 'tabris-decorators';

class MyInjectionHandler {

  @injectionHandler(Foo)
  static handleInjection(injection: Injection) {
    return new Foo();
  }

}
```

## @injectionHandler({targetType: Class, priority?: number})

Like `@injectionHandler(targetType: Class)`, but allows to give a priority, just like [`@injectable({priority: number})`](./@injectable.md). The priority controls in which order injection handlers for the same target type are called, with the highest priority handler being called first.
