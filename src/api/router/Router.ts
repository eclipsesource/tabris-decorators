import { NavigationView } from "tabris";
import { ListLike, Mutation } from "../List";
import { RouterMatcher } from "./RouterMatcher";
import { RouterHistory, HistoryItem } from "./RouterHistory";
import { Route } from "./Route";

export type RouterProperties = {
  navigationView: NavigationView,
  defaultRoute?: HistoryItem,
  history?: ListLike<HistoryItem>
};

export class Router<ItemType extends  HistoryItem = HistoryItem> {

  private _navigationView: NavigationView;
  private _routerHistoryObserver: RouterHistory;
  private _routerMatcher: RouterMatcher;

  constructor({navigationView, history} : RouterProperties) {
    this._navigationView = navigationView;
    this._routerHistoryObserver = new RouterHistory(this._handleHistoryChange);
    this._routerMatcher = new RouterMatcher();
    this.history = history || [];
    this._navigationView.onRemoveChild(this._syncHistoryWithNavigationView.bind(this));
  }

  goTo(item: ItemType) {
    this._routerHistoryObserver.push(item);
  }

  back() {
    if (this._routerHistoryObserver.history.length === 0) {
      throw new Error("Could not call back on empty history stack");
    }
    this._routerHistoryObserver.pop();
  }

  set history(value: ListLike<HistoryItem>) {
    this._routerHistoryObserver.history = value;
  }

  get history() {
    return this._routerHistoryObserver.history;
  }

  protected _handleHistoryChange = ({deleteCount, items}: Mutation<ItemType>) => {
    if (deleteCount > items.length) {
      this._disposeRoutes(deleteCount);
    } else if (items.length > deleteCount) {
      this._appendRoutes(items);
    }
  }

  private _disposeRoutes(count: number = 0) {
    if (count <= 0) {
      return;
    }
    const size = this._navigationView.children().length;
    this._navigationView
      .children()
      .slice(size - count)
      .forEach(child => child.dispose());
  }

  private _appendRoutes(routes: ListLike<ItemType>) {
    routes.forEach(item => {
      const route = this._routerMatcher.match(item);
      this._appendRoute(route, item.payload);
    });
  }

  private _appendRoute(route: Route, payload?: object) {
    if (payload) {
      for (const key of Object.keys(payload)) {
        if (key in route.page) {
          route.page[key] = payload[key];
        }
      }
    }
    this._navigationView.append(route.page);
  }

  private _syncHistoryWithNavigationView() {
    while (this.history.length !== this._navigationView.children().length) {
      this._routerHistoryObserver.removeLast();
    }
  }

}
