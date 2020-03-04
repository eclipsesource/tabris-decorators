import { NavigationView } from "tabris";
import { ListLike, Mutation } from "../List";
import { RouterMatcher } from "./RouterMatcher";
import { RouterHistory, HistoryItem } from "./RouterHistory";
import { Route } from "./Route";
import { Constructor } from "../../internals/utils";

export type RouterConfig = {
  name: string;
  route: Constructor<Route>
};

export type RouterProperties = {
  navigationView: NavigationView,
  routers?: ListLike<RouterConfig>,
  defaultRoute?: HistoryItem,
  history?: ListLike<HistoryItem>
};

export class Router<ItemType extends  HistoryItem = HistoryItem> {

  private _navigationView: NavigationView;
  private _routes: ListLike<RouterConfig>;

  private _routerHistoryObserver: RouterHistory;
  private _routerMatcher: RouterMatcher;

  constructor({navigationView, routers, defaultRoute, history} : RouterProperties) {
    this._navigationView = navigationView;
    this.routes = routers || [];
    this._routerHistoryObserver = new RouterHistory(this._handleHistoryChange);
    this.history = history || [];
    this._routerMatcher = new RouterMatcher(this);
    if (defaultRoute) {
      this.goTo(defaultRoute as ItemType);
    }
    this._navigationView.onRemoveChild(this._syncHistoryWithNavigationView.bind(this));
  }

  goTo(item: ItemType) {
    this._routerHistoryObserver.push(item);
  }

  back() {
    if (this._routerHistoryObserver.source.length === 0) {
      throw new Error("Could not call back on empty history stack");
    }
    this._routerHistoryObserver.pop();
  }

  set history(value: ListLike<HistoryItem>) {
    if (this._routerHistoryObserver.source === value) {
      return;
    }
    this._routerHistoryObserver.source = value;
  }

  get history() {
    return this._routerHistoryObserver.source;
  }

  set routes(value: ListLike<RouterConfig>) {
    if (this._routes === value) {
      return;
    }
    this._routes = value;
    this._routerMatcher = new RouterMatcher(this);
  }

  get routes() {
    return this._routes;
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

  private _appendRoute(route: Route, payload?: any) {
    if (route.page.onPayload && typeof route.page.onPayload === 'function') {
      route.page.onPayload(payload);
    }
    this._navigationView.append(route.page);
    this._navigationView.drawerActionVisible = route.options.enableDrawer;
    this._navigationView.toolbarVisible = route.options.toolbarVisible;
  }

  private _syncHistoryWithNavigationView() {
    while (this.history.length !== this._navigationView.children().length) {
      this._routerHistoryObserver.removeLast();
    }
  }

}
