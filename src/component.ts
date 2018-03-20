import { Widget } from 'tabris';
import { bindingBase } from './bindingBase';
import { isolated } from './isolated';
import { BaseConstructor } from './utils';

export function component(type: BaseConstructor<Widget>) {
  isolated(type);
  bindingBase(type);
}
