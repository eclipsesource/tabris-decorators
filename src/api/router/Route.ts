import { Page } from "tabris";

export type Dictionary<T> = { [key: string]: T };

export class Route<PayloadType = Dictionary<string>> {
  page: Page;
  payload?: PayloadType;
}
