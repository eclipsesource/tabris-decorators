import { Route } from "./Route";
import { HistoryItem } from './RouterHistory';
import { resolve } from "../..";

export class RouterMatcher {
  match(historyItem: HistoryItem): Route {
    const name = historyItem.route;
    const route = this._createRoute(name);
    if (!route) {
      throw new Error(`Route with '${name}' name does not exist!`);
    }
    return route;
  }

  private _createRoute(name: string): Route {
    return resolve(Route, name);
  }
}
