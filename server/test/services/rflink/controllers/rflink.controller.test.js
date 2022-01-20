const sinon = require('sinon');

const { assert, fake, stub } = sinon;
const { expect } = require('chai');
const RFLinkController = require('../../../../services/rflink/api/rflink.controller');

const serviceId = '6d1bd783-ab5c-4d90-8551-6bc5fcd02212';
const gladys = {
  service: {
    getLocalServiceByName: stub().resolves({
      id: serviceId,
    }),
  },
  event: {
    emit: fake.returns(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
  variable: {
    getValue: stub()
      .withArgs('RFLINK_PATH', serviceId)
      .resolves('//tty'),
  },
};

const rflinkHandler = {
  gladys: fake.returns(gladys),
  serviceId: fake.returns(serviceId),
  connected: false,
  ready: false,
  scanInProgress: false,
  newDevices: [],
  devices: fake.returns([]),
  currentMilightGateway: fake.returns('F746'),
  milightBridges: fake.returns({}),
  pair: stub().resolves(),
  unpair: stub().resolves(),
  getNewDevices: fake.resolves(true),
  connect: stub()
    .withArgs('rflinkPath')
    .resolves('connected'),
  disconnect: stub().resolves(),
  sendUsb: {
    write: stub()
      .withArgs('command')
      .resolves(),
  },
};

describe('POST /api/v1/service/rflink/connect', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should connect successfully', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    gladys.variable.getValue = stub()
      .withArgs('RFLINK_PATH')
      .resolves('//tty');
    await controller['post /api/v1/service/rflink/connect'].controller(req, res);
    assert.calledOnce(gladys.variable.getValue);
    assert.calledOnce(rflinkHandler.connect);
    assert.calledWith(res.json, { success: true });
  });

  it('should raise an error on connection when no path is given', async () => {
    rflinkHandler.connect = fake.throws(new Error('path null'));
    gladys.variable.getValue = stub()
      .withArgs('RFLINK_PATH', serviceId)
      .resolves('');
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/connect'].controller(req, res);
    assert.calledOnce(rflinkHandler.connect);
    // assert.calledWith(res.json, { success: false });
    expect(rflinkHandler.connected).to.be.deep.equal(false);
  });
});

describe('POST /api/v1/service/rflink/disconnect', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should disconnect successfully', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/disconnect'].controller(req, res);
    assert.calledOnce(rflinkHandler.disconnect);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/rflink/pair', () => {
  let controller;

  beforeEach(() => {
    gladys.variable.getValue = stub()
      .withArgs('CURRENT_MILIGHT_GATEWAY')
      .resolves('64b');
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should send a milight pairing command', async () => {
    const req = {
      body: {
        zone: 42,
      },
    };
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/pair'].controller(req, res);
    assert.calledOnce(gladys.variable.getValue);
    assert.calledOnce(res.json);
  });

  it('should send a milight pairing command even without a milight zone defined nor a gateway', async () => {
    gladys.variable.getValue = stub()
      .withArgs('CURRENT_MILIGHT_GATEWAY')
      .resolves(null);
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
    const req = {
      body: {
        zone: undefined,
      },
    };
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/pair'].controller(req, res);
    assert.calledWith(rflinkHandler.pair, rflinkHandler.currentMilightGateway, 1);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/rflink/unpair', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should send a milight unpairing command even without a milight zone defined nor a gateway', async () => {
    gladys.variable.getValue = stub()
      .withArgs('CURRENT_MILIGHT_GATEWAY')
      .resolves(null);
    const req = {
      body: {
        zone: undefined,
      },
    };
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/unpair'].controller(req, res);
    assert.calledWith(rflinkHandler.unpair, rflinkHandler.currentMilightGateway, 1);
    assert.calledOnce(rflinkHandler.unpair);
    assert.calledOnce(res.json);
  });

  it('should send a milight unpairing command', async () => {
    const req = {
      body: {
        zone: 42,
      },
    };
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/unpair'].controller(req, res);
    assert.calledOnce(rflinkHandler.unpair);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/rflink/newDevices', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should get new devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await controller['get /api/v1/service/rflink/newDevices'].controller(req, res);
    assert.calledOnce(rflinkHandler.getNewDevices);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/rflink/status', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should get rflink status', async () => {
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

  it('should send a debug test message', async () => {
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

describe('POST /api/v1/service/rflink/remove', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should remove a device from the new device list', async () => {
    const externalId = `rflink:86aa7:11`;
    const device = {
      external_id: externalId,
    };
    rflinkHandler.newDevices = [device];
    const req = {
      body: {
        external_id: externalId,
      },
    };
    const res = { json: fake.returns(true) };
    await controller['post /api/v1/service/rflink/remove'].controller(req, res);
    expect(rflinkHandler.newDevices).to.be.deep.equal([]);
    assert.calledOnce(res.json);
  });

  it('should not remove a device from the new device list (because not found)', async () => {
    const externalId = `rflink:86aa7:11`;
    const device = {
      external_id: externalId,
    };
    rflinkHandler.newDevices = [device];
    const req = {
      body: {
        external_id: `rflink:86aa7:12`,
      },
    };
    const res = { json: fake.returns(true) };
    await controller['post /api/v1/service/rflink/remove'].controller(req, res);
    expect(rflinkHandler.newDevices).to.be.deep.equal([device]);
    assert.calledOnce(res.json);
  });
});
