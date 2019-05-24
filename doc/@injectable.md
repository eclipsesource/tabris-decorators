---
---
## @injectable

> :point_right: Make sure to first read the introduction to [decorators](./decorators.md) and the [`@inject`](./@inject.md) documentation.

Apply this to a class to register it for injection.

## @injectable (no parameter)

Makes the decorated class injectable as itself or for any of its super-classes (except `Object`). Each injection will create a new instance.

```ts
import {injectable, inject, create, resolve} from 'tabris-decorators';

class Foo {}

@injectable
class Bar extends Foo {} // could  also have injection dependencies itself
```

Instances of an injectable class may then be be obtained via [`@inject`](./@inject.md):

```ts
// ...

class MyClient {

  constructor(
    @inject a: Bar; // This will be an instance of Bar
    @inject b: Bar; // This will another instance of Bar
    @inject c: Foo; // This will also be an instance of Bar since Foo is not injectable
  ) {
    // ...
  }

}
```

Or by explicitly calling [`resolve()`](./Injector.md):

```ts
// ...
const a = resolve(Bar);
const b = resolve(Bar);
const c = resolve(Foo);
```


If you want to share a single instance for all injections, use `@injectable({shared: true})` or [`@shared`](./@shared.md) instead.

## @injectable(config: InjectableConfig)

Where `InjectableConfig` is
```ts
{
  shared?: boolean,
  implements?: Class,
  param?: InjectionParameter,
  priority?: number
}
```

Like `@injectable`, but with more options.

* If `shared` is `true`, all injections of the class will use the same instance. This makes the class effectively a singleton.

* `implements` allows the decorated class to be injected as an instance of the given class if they have a compatible interface.

* If `param` is set the decorated class will only be injected for injections that have the same injection parameter. The parameter may be given via [`@inject(param: InjectionParameter)`](./@inject.md) or [`resolve(type: Class, param: InjectionParameter)`](./Injector.md). This is may be useful if multiple compatible types are made injectable.

* The `priority` controls the priority of this class over other compatible injectable classes. The class with the highest priority will be used for injection. This value defaults to zero. If there are multiple classes registered with the same priority, the last class that was registered is used to resolve the injection.
