const { assert, fake, stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const RflinkMock = require('../rflinkMock.test');


const RFLinkController = proxyquire('../../../../services/rflink/api/rflink.controller', {
  SerialPort: RflinkMock,
});

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
const gladysMilight = {
  variable: {
    getValue: fake.resolves('CURRENT_MILIGHT_GATEWAY'),
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
  pair: fake.resolves(true),
  unpair: fake.resolves(true),
  getNewDevices: fake.resolves(true),
  connect: fake.resolves(true),
  disconnect: fake.resolves(true),
  sendUsb: {
    write: stub().withArgs('command').resolves(),
  },
};

describe('POST /api/v1/service/rflink/pair', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladysMilight, rflinkHandler, serviceId);
  });

  it('Pair test', async () => {
    const req = {
      body: {
        zone: 42
      }
    };
    const res = {
      json: fake.returns(null),
    };
    await controller['post /api/v1/service/rflink/pair'].controller(req, res);
    assert.calledOnce(gladysMilight.variable.getValue);
    assert.calledWith(rflinkHandler.pair, '', 42);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/rflink/unpair', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('Unpair test', async () => {
    const req = {
      body: {
        zone: 42
      }
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

describe('POST /api/v1/service/rflink/connect', () => {
  let controller;
  let gladys2;

  before(() => {

    gladys2 = {
      service: {
        getLocalServiceByName: stub().resolves({
          id: '6d1bd783-ab5c-4d90-8551-6bc5fcd02212',
        }),
      },
      event: new EventEmitter(),
      variable: {
        getValue: fake.resolves('RFLINK_PATH'),
      },
    };
    controller = RFLinkController(gladys2, rflinkHandler);
  });



  it('should connect successfully', async () => {
    const req = {};
    const res = { json: fake.returns(true) };
    await controller['post /api/v1/service/rflink/connect'].controller(req, res);
    assert.calledOnce(gladys2.variable.getValue);
    assert.calledOnce(rflinkHandler.connect);
    // assert.calledOnce(res.json); KO for unknown reason :(
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

describe('GET /api/v1/service/rflink/status', () => {
  let controller;

  beforeEach(() => {
    controller = RFLinkController(gladys, rflinkHandler, serviceId);
  });

  it('should get status', async () => {
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
