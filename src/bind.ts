import {Composite} from 'tabris';
import {createBinding} from './data-binding';
import {applyDecorator, WidgetInterface} from './utils';

export default function bind(bindingPath: string): (target: Composite, property: string) => void;
export default function bind(...args: any[]): any {
  return applyDecorator('bind', args, (targetProto: WidgetInterface, targetProperty: string) => {
    const bindingPath = args[0] as string;
    createBinding(targetProto, targetProperty, bindingPath);
  });
}
