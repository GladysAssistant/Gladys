const { assert, fake } = require('sinon');
const BroadlinkController = require('../../../../services/broadlink/api/broadlink.controller');

const broadlinkHandler = {
  getPeripherals: fake.resolves(true),
  learn: fake.resolves(true),
  cancelLearn: fake.resolves(true),
  send: fake.resolves(true),
};

describe('GET /api/v1/service/broadlink/peripheral', () => {
  let controller;

  beforeEach(() => {
    controller = BroadlinkController(broadlinkHandler);
  });

  it('Connect test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/broadlink/peripheral'].controller(req, res);
    assert.calledOnceWithExactly(broadlinkHandler.getPeripherals);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/broadlink/learn', () => {
  let controller;

  beforeEach(() => {
    controller = BroadlinkController(broadlinkHandler);
  });

  it('Entering learn mode', async () => {
    const req = {
      body: {
        peripheral: 'MAC',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/broadlink/learn'].controller(req, res);
    assert.calledWith(broadlinkHandler.learn, 'MAC');
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/broadlink/cancelLearn', () => {
  let controller;

  beforeEach(() => {
    controller = BroadlinkController(broadlinkHandler);
  });

  it('Cancel learn mode', async () => {
    const req = {
      body: {
        peripheral: 'MAC',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/broadlink/learn/cancel'].controller(req, res);
    assert.calledWith(broadlinkHandler.cancelLearn, 'MAC');
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/broadlink/send', () => {
  let controller;

  beforeEach(() => {
    controller = BroadlinkController(broadlinkHandler);
  });

  it('Send/test code', async () => {
    const req = {
      body: {
        peripheral: 'MAC',
        code: 'CODE',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/broadlink/send'].controller(req, res);
    assert.calledWith(broadlinkHandler.send, 'MAC', 'CODE');
    assert.calledOnce(res.json);
  });
});
