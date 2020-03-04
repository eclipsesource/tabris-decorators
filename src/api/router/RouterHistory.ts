import { ListLikeObvserver } from "../../internals/ListLikeObserver";

export type HistoryItem = { route: string, payload?: any };

export class RouterHistory<T extends HistoryItem = HistoryItem> extends ListLikeObvserver<T> {

  public push(item: T) {
    const source = Array.from(this.source);
    source.push(item);
    this.source = source;
  }

  public pop(): T {
    const source = Array.from(this.source);
    const result = source.pop();
    this.source = source;
    return result;
  }

  public removeLast() {
    return this.source.pop();
  }

  get current() {
    return this.source[this.source.length - 1];
  }

}
