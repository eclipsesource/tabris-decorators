export class ChangeEvent<T> {

  public target: T;

  public type: string;

  public value: any;

  public timeStamp: number = Date.now();

  constructor(target: T, type: string, value: any) {
    this.target = target;
    this.type = type;
    this.value = value;
  }

}
