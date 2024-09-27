import { ListLikeObvserver } from "../../internals/ListLikeObserver";
import { Mutation, List, ListLike } from "../List";
import { Dictionary } from "./Route";

export type HistoryItem = { route: string, payload?: Dictionary<string> };

export class RouterHistory<T extends HistoryItem = HistoryItem> {

  private _observer: ListLikeObvserver<T>;

  constructor(_callback: (ev: Mutation<T>) => void) {
    this._observer = new ListLikeObvserver<T>(_callback);
  }

  public push(item: T) {
    const source = this.getSource();
    source.push(item);
    this._observer.source = source;
  }

  public pop(): T {
    const source = this.getSource();
    const result = source.pop();
    this._observer.source = source;
    return result;
  }

  public removeLast() {
    return this._observer.source.pop();
  }

  get history() {
    return this._observer.source;
  }

  set history(value: ListLike<T>) {
    this._observer.source = value;
  }

  get current() {
    return this._observer.source[this._observer.source.length - 1];
  }

  private getSource() {
    if (this._observer.source instanceof Array) {
      return Array.from(this._observer.source);
    } else if (this._observer.source instanceof List) {
      return List.from(this._observer.source);
    }
    throw new Error('Unsupported type');
  }

}
