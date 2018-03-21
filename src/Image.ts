import { typeGuards } from './TypeGuards';

export class Image {

  public src?: string;
  public width?: number;
  public height?: number;
  public scale?: number;
  readonly [i: number]: string;

}

typeGuards.add(Image, v => {
  if (!v || typeof v === 'string') {
    return true;
  }
  if (typeof v === 'object') {
    return typeof v.src === 'string';
  }
  return false;
});
