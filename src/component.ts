import { Widget } from 'tabris';
import bindingBase from './bindingBase';
import isolated from './isolated';
import { BaseConstructor } from './utils';

export default function component(type: BaseConstructor<Widget>) {
  isolated(type);
  bindingBase(type);
}
