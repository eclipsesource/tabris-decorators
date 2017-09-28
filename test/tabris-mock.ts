/* tslint:disable */
import * as tabris from 'tabris';

// polyfill installs fetch on self
declare namespace global {
  let self: any;
  let tabris: any;
}

declare namespace window {
  let self: any;
  let devicePixelRatio: any;
}

declare module 'tabris' {
  export function  trigger(event: string): void;
  export function  _notify(cid: string, event: string, props?: Properties);
  export function _init(clientMock: ClientMock);
}

interface Properties {[cid: string]: any};

global.self = global;

class ClientMock {

  private _widgets: {[cid: string]: {type?: string, props: Properties}};

  constructor() {
    this._widgets = {};
  }

  create(cid, type, properties) {
    this._widgets[cid] = {type, props: {}};
    Object.assign(this._widgets[cid].props, properties);
  }

  set(cid, properties) {
    if (!(cid in this._widgets)) {
      this._widgets[cid] = {props: {}};
    }
    Object.assign(this._widgets[cid].props, properties);
  }

  get(cid, name) {
    let value = cid in this._widgets ? this._widgets[cid].props[name] : undefined;
    if (name === 'bounds' && !value) {
      value = [0, 0, 0, 0];
    }
    return value;
  }

  call() {
  }

  listen() {
  }

  destroy() {
  }

}

let clientMock;

export function fakeInput(widget, value) {
  tabris.trigger('flush');
  clientMock.set(widget.cid, {text: value});
  tabris._notify(widget.cid, 'modify', {text: value});
}

export function fakeTap(widget) {
  tabris.trigger('flush');
  if (widget._recognizers && widget._recognizers.tap) {
    tabris._notify(widget._recognizers.tap.cid, 'gesture', {
      state: 'recognized',
      touches: [{x: 0, y: 0}]
    });
  }
}

export function fakeSelect(widget, selection) {
  // TODO: support select for other widgets with selection
  if (widget.type === 'Button') {
    tabris.trigger('flush');
    tabris._notify(widget.cid, 'Selection', {});
  } else if (widget.type === 'Picker') {
    tabris.trigger('flush');
    tabris._notify(widget.cid, 'Selection', {selectionIndex: selection});
  } else if (widget.type === 'CollectionView') {
    tabris.trigger('flush');
    tabris._notify(widget.cid, 'selection', {index: selection});
  } else if (widget.type === 'TabFolder') {
    tabris.trigger('flush');
    tabris._notify(widget.cid, 'Selection', {selection: selection._tabItem.cid});
  }
}

export function fakeBounds(widget, bounds) {
  tabris.trigger('flush');
  clientMock.set(widget.cid, {bounds: [bounds.left, bounds.top, bounds.width, bounds.height]});
}

export function fakeRefresh(widget) {
  tabris.trigger('flush');
  clientMock.set(widget.cid, {refreshIndicator: true});
  tabris._notify(widget.cid, 'refresh');
}

export function fakeVersion(version) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('version', version);
}

export function fakeScaleFactor(scaleFactor) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('scaleFactor', scaleFactor);
  window.devicePixelRatio = scaleFactor;
}

export function fakePlatform(platform) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('platform', platform);
}

export function fakeModel(model) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('model', model);
}

export function fakeScreenSize(width, height) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('screenWidth', width);
  setTabrisDeviceProperty('screenHeight', height);
}

export function fakeOrientation(orientation) {
  tabris.trigger('flush');
  setTabrisDeviceProperty('orientation', orientation);
}

function setTabrisDeviceProperty(name, value) {
  let widget = clientMock._widgets[tabris.device.cid];
  let props = Object.assign({}, widget && widget.props, {[name]: value});
  clientMock.set(tabris.device.cid, props);
}

export function reset() {
  let storageBackup = localStorage;
  initTabris();
  localStorage = storageBackup;
  localStorage.clear();
  delete localStorage._rwtId;
}

function initTabris() {
  for (let key in global.tabris) {
    if (global.tabris[key] instanceof Object) {
      delete global.tabris[key]._rwtId;
    }
  }
  clientMock = new ClientMock();
  tabris._init(clientMock);
  fakePlatform('test');
  fakeVersion('1.2.3');
  fakeModel('testmodel');
  fakeScreenSize(400, 700);
  fakeOrientation('portrait');
  fakeScaleFactor(2);
}

initTabris();
