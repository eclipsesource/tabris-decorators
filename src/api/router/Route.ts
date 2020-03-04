import { Page, Properties } from "tabris";

export interface RouteOptions {
  enableDrawer?: boolean;
  toolbarVisible?: boolean;
}

export interface RoutePage {
  onPayload?(payload?: any): void;
}

export abstract class RoutePage extends Page {
  constructor(properties?: Properties<RoutePage>) {
    super(properties);
  }
}

export abstract class Route {
  page: RoutePage;
  options: RouteOptions = {
    enableDrawer: false,
    toolbarVisible: true
  }
}
