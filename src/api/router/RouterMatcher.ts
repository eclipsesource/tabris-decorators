import { Router, RouterConfig } from "./Router";
import { Route } from "./Route";
import { HistoryItem } from './RouterHistory';
import { Constructor } from "../../internals/utils";

export class RouterMatcher {
  private _nameMap: Map<string, RouterConfig> = new Map();

  constructor(router: Router) {
    const routes = router.routes || [];
    routes.forEach(item => {
      if (this._nameMap.has(item.name)) {
        throw new Error(`Route with '${item.name}' name already exists!`);
      }
      this._nameMap.set(item.name, item);
    });
  }

  match(historyItem: HistoryItem): Route {
    const name = historyItem.route;
    if (this._nameMap.has(name)) {
      return this._createRoute(this._nameMap.get(name).route);
    }
    throw new Error(`Route with '${name}' name does not exist!`);
  }

  private _createRoute(className: Constructor<Route>): Route {
    return new className(); // TODO: support to pass parameters
  }
}
