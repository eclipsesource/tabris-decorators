import { Composite } from 'tabris';
import { createBoundProperty } from '../internals/bind-two-way';
import { applyDecorator, TypeGuard, WidgetInterface } from '../internals/utils';

export function bind(arg: BindConfig | string): (target: Composite, property: string) => void;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const targetPath = typeof args[0] === 'string' ? args[0] : args[0].path;
    const typeGuard = typeof args[0] === 'string' ? undefined : args[0].typeGuard;
    createBoundProperty(baseProto, baseProperty, targetPath, typeGuard);
  });
}

export interface BindConfig {
  path: string;
  typeGuard: TypeGuard;
}
