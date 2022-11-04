import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import {tabris} from 'tabris';
import ClientMock from 'tabris/ClientMock';

chai.use(sinonChai);

const sandbox = sinon.sandbox.create();
const spy = sandbox.spy.bind(sandbox) as sinon.SinonSpyStatic;
const stub = sandbox.stub.bind(sandbox) as sinon.SinonStubStatic;
const mock = sandbox.mock.bind(sandbox) as sinon.SinonMockStatic;
const restoreSandbox: () => void = sandbox.restore.bind(sandbox) as () => void;

tabris._init(new ClientMock());

// eslint-disable-next-line @typescript-eslint/no-var-requires
(require('../src') as any).injector.jsxProcessor.unsafeBindings = 'error';

export {expect, spy, stub, mock, restoreSandbox};
