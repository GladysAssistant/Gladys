const sinon = require('sinon');

const { assert, fake } = sinon;

const EcovacsController = require('../../../../services/ecovacs/api/ecovacs.controller');

const vacbotStatus = {
  name: 'DEEBOT OZMO 920 Series',
  model: 'Deebot 2022',
};

const ecovacsHandler = {
  getVacbots: fake.resolves(true),
  start: fake.resolves(true),
  stop: fake.resolves(true),
  connect: fake.resolves(true),
  getStatus: fake.resolves(true),
  getConfiguration: fake.resolves(true),
  saveConfiguration: fake.resolves(true),
  discover: fake.returns(['device']),
  setValue: fake.resolves(true),
  poll: fake.resolves(true),
  getDeviceStatus: fake.returns(vacbotStatus),
  gladys: {
    device: {
      getBySelector: fake.returns({ external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:0' }),
      get: fake.resolves(true),
    },
  },
};

let req = {};
let res = {
  json: fake.returns(null),
};

describe('GET /api/v1/service/ecovacs/vacbots', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should return vacbots', async () => {
    await controller['get /api/v1/service/ecovacs/vacbots'].controller(req, res);
    assert.calledWith(ecovacsHandler.gladys.device.get, { service: 'ecovacs' });
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/connect', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should connect', async () => {
    await controller['get /api/v1/service/ecovacs/connect'].controller(req, res);
    assert.calledOnce(ecovacsHandler.connect);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/discover', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should connect', async () => {
    await controller['get /api/v1/service/ecovacs/discover'].controller(req, res);
    assert.calledOnce(ecovacsHandler.discover);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/status', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should get ecovacs service status', async () => {
    await controller['get /api/v1/service/ecovacs/status'].controller(req, res);
    assert.calledOnce(ecovacsHandler.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/config', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should get ecovacs configuration', async () => {
    await controller['get /api/v1/service/ecovacs/config'].controller(req, res);
    assert.calledOnce(ecovacsHandler.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/ecovacs/config', () => {
  let controller;

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should save ecovacs configuration', async () => {
    req = {
      body: [],
    };
    res = {
      json: fake.returns({ success: true }),
    };

    await controller['post /api/v1/service/ecovacs/config'].controller(req, res);
    assert.calledWith(ecovacsHandler.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/:device_selector/status', () => {
  let controller;
  res = {
    json: fake.returns(null),
  };

  beforeEach(() => {
    sinon.reset();
    controller = EcovacsController(ecovacsHandler);
  });

  it('should get vacbot (ecovacs device) status', async () => {
    req = {
      params: {
        device_selector: 'ecovacs:5c19a8f3a1e6ee0001782247:0',
      },
    };
    await controller['get /api/v1/service/ecovacs/:device_selector/status'].controller(req, res);
    assert.calledOnce(ecovacsHandler.getDeviceStatus);
    assert.calledWith(res.json, vacbotStatus);
  });

  it('should not get vacbot (ecovacs device) status without an external_id', async () => {
    req = {
      params: {
        device_selector: '',
      },
    };
    ecovacsHandler.gladys = { device: { getBySelector: fake.returns({}) } };
    await controller['get /api/v1/service/ecovacs/:device_selector/status'].controller(req, res);
    assert.notCalled(ecovacsHandler.getDeviceStatus);
    assert.calledWith(res.json, {});
  });
});
