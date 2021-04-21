# Example "injector-js"

[![GitPod Logo](../../doc/run-in-gitpod.png)](https://gitpod.io/#example=injector-js/https://github.com/eclipsesource/tabris-decorators/tree/master/examples/injector-js)

## Description

Note: A TypeScript/JSX variant of the this plain JavaScript example can be found [here](../injectable).

Demonstrates the use of the `Injector` to register various classes for dependency injection. This uses the global default injector, but using a custom injector would work the same way except that custom components (widget subclasses) will have to obtain the custom injector themselves somehow.
