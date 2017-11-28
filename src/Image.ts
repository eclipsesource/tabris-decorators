import {instance as typeGuards} from './TypeGuards';

export default class Image {

  public src?: string;
  public width?: number;
  public height?: number;
  public scale?: number;
  readonly [i: number]: string;

}

typeGuards.set(Image, (v: any): v is Image => {
  if (!v || typeof v === 'string') {
    return true;
  }
  if (typeof v === 'object') {
    return typeof v.src === 'string';
  }
  return false;
});
