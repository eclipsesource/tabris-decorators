import { Injector } from '../src';

export const injector = new Injector();
export const { inject, shared, injectable, injectionHandler, create, resolve } = new Injector();
