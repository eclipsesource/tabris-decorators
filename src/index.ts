import { injector } from './api/Injector';

export * from './decorators/component';
export * from './decorators/property';
export * from './decorators/bind';
export * from './decorators/getById';
export * from './decorators/event';
export * from './api/checkType';
export * from './api/ChangeEvent';
export * from './api/Injector';
export * from './api/interfaces';
export * from './api/Listeners';
export const { inject, injectable, shared, injectionHandler } = injector;
(JSX as any) = injector.JSX;
