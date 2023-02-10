const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');
const { Error403, Error500 } = require('../../../utils/httpErrors');

const { fake } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.getBackups', () => {
  const event = {};

  let gateway;

  beforeEach(async () => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    const config = getConfig();

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    gateway = new Gateway({}, event, {}, {}, config, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get backups', async () => {
    const backups = await gateway.getBackups();
    expect(backups).to.deep.equal([
      {
        id: '74dc8d58-3997-484a-a791-53e5b07279d7',
        account_id: 'b2d23f66-487d-493f-8acb-9c8adb400def',
        path: 'http://backup-url',
        size: 1000,
        created_at: '2018-10-16T02:21:25.901Z',
        updated_at: '2018-10-16T02:21:25.901Z',
        is_deleted: false,
      },
    ]);
  });

  it('should throw 403 error on error with gateway', async () => {
    // force error on gateway client
    const error = new Error();
    error.response = { status: 403 };
    gateway.gladysGatewayClient.getBackups = fake.rejects(error);

    try {
      await gateway.getBackups();
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(Error403);
    }
  });

  it('should throw 500 error on invalid gateway', async () => {
    // force error on gateway client
    gateway.gladysGatewayClient.getBackups = fake.rejects(null);

    try {
      await gateway.getBackups();
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(Error500);
    }
  });
});
