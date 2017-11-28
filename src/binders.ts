import {Composite} from 'tabris';
import {createBinding} from './data-binding';
import {applyDecorator, WidgetInterface} from './utils';

export function bind(bindingPath: string): (target: Composite, property: string) => void;
export function bind(...args: any[]): any {
  return applyDecorator('bind', args, (targetProto: WidgetInterface, targetProperty: string) => {
    const bindingPath = args[0] as string;
    createBinding(targetProto, targetProperty, bindingPath);
  });
}

export function bindTo(bindingPath: string): (target: Composite, property: string) => void;
export function bindTo(...args: any[]): any {
  return applyDecorator('bindTo', args, (targetProto: WidgetInterface, targetProperty: string) => {
    const bindingPath = args[0] as string;
    createBinding(targetProto, targetProperty, bindingPath, true);
  });
}
