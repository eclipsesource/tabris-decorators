import { Injection, injector } from './api/Injector';
import { InjectableConfig } from './decorators/injectable';
import { Constructor } from './internals/utils';

export * from './decorators/component';
export * from './decorators/property';
export * from './decorators/bind';
export * from './decorators/getById';
export * from './decorators/event';
export * from './api/checkType';
export * from './api/Injector';
export * from './api/interfaces';
export * from './api/Listeners';
export const { inject, injectable, shared, injectionHandler, resolve, create } = injector;
(JSX as any) = injector.JSX;
