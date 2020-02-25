import {expect, use} from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import {tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';

use(sinonChai);

const sandbox = sinon.sandbox.create();
const spy = sandbox.spy.bind(sandbox) as sinon.SinonSpyStatic;
const stub = sandbox.stub.bind(sandbox) as sinon.SinonStubStatic;
const mock = sandbox.mock.bind(sandbox) as sinon.SinonMockStatic;
const restoreSandbox: () => void = sandbox.restore.bind(sandbox) as () => void;

tabris._init(new ClientMock());

require('../src').injector.jsxProcessor.strictMode = true;

export {expect, spy, stub, mock, restoreSandbox};
