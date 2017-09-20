/* tslint:disable no-namespace */

import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import {use, expect} from 'chai';

use(sinonChai);

let sandbox = sinon.sandbox.create();
let spy = sandbox.spy.bind(sandbox) as sinon.SinonSpyStatic;
let stub = sandbox.stub.bind(sandbox) as sinon.SinonStubStatic;
let mock = sandbox.mock.bind(sandbox) as sinon.SinonMockStatic;
let restoreSandbox: () => void = sandbox.restore.bind(sandbox) as () => void;

export {expect, spy, stub, mock, restoreSandbox};
