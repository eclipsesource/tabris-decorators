import { Composite } from 'tabris';
import { createBoundProperty } from '../internals/bind-two-way';
import { applyDecorator, WidgetInterface } from '../internals/utils';

export function bind(targetPath: string): (target: Composite, property: string) => void;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (baseProto: WidgetInterface, baseProperty: string) => {
    const targetPath = args[0] as string;
    createBoundProperty(baseProto, baseProperty, targetPath);
  });
}
