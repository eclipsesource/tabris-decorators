---
---
## @shared

> :point_right: Make sure to first read the [introduction to dependency injection](./index.md) and the [`@inject`](./@inject.md) documentation.

This decorators is simply a shorthand for [`@injectable({shared: true})`](./@injectable.md). Use it for services that can or must be shared across all clients, either because they are stateless/static, or because the state is supposed to be global (singleton pattern).
