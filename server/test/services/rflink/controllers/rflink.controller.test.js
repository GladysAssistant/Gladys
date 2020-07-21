const { assert, fake, stub } = require('sinon');
const RFLinkController = require('../../../../services/rflink/api/rflink.controller');

const serviceId = 'service-uuid-random';
const gladys = {
  event: {
    emit: fake.returns(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves('RFLINK_PATH'),
  },
};
const rflinkHandler = {
  gladys: fake.returns(gladys),
  serviceId: fake.returns(serviceId),
  connected: fake.returns(false),
  ready: fake.returns(false),
  scanInProgress: fake.returns(false),
  newDevices: fake.returns([]),
  devices: fake.returns([]),
  currentMilightGateway: fake.returns('F746'),
  milightBridges: fake.returns({}),
  getNewDevices: fake.resolves(true),
  connect: stub(),
  disconnect: fake.resolves(true),
  sendUsb: {
    write: stub().withArgs('command').resolves(),
  },
};

describe('GET /api/v1/service/rflink/devices', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('getDevices test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['get /api/v1/service/rflink/devices'].controller(req, res);
    // assert.calledOnce(rflinkHandler.getNewDevices);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/rflink/connect', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('Connect test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/connect'].controller(req, res);
    assert.calledOnce(rflinkHandler.connect);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/rflink/disconnect', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('Disconnect test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/disconnect'].controller(req, res);
    assert.calledOnce(rflinkHandler.disconnect);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/rflink/status', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('Status test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['get /api/v1/service/rflink/status'].controller(req, res);
    assert.calledOnce(res.json);
  });

});

describe('POST /api/v1/service/rflink/debug', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('Debug test', async () => {

    const req = {
      body: {
        value: '10;MiLightv1;9926;02;34BC;ON;',
      },
    };
    const command = '10;MiLightv1;9926;02;34BC;ON;\n';
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/debug'].controller(req, res);
    assert.calledWith(rflinkHandler.sendUsb.write, command);
    assert.calledOnce(res.json);
  });
});
