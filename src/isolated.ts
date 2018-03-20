import 'reflect-metadata';
import { Widget, WidgetCollection } from 'tabris';
import { applyClassDecorator, BaseConstructor, ClassDecoratorFactory } from './utils';

export function isolated(type: BaseConstructor<Widget>): void;
export function isolated(...args: any[]): void | ClassDecoratorFactory<Widget> {
  return applyClassDecorator('isolated', args, (type: BaseConstructor<Widget>) => {
    if (type.prototype.children !== returnEmptyCollection) {
      type.prototype.children = returnEmptyCollection;
    }
  });
}

function returnEmptyCollection() {
  return new WidgetCollection([]);
}
