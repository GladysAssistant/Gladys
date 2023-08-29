const sinon = require('sinon');

const { assert, fake, stub } = sinon;

const OverkizController = require('../../../../services/overkiz/api/overkiz.controller');

const overkizService = {
  connect: stub(),
  disconnect: stub(),
  status: stub(),
  getConfiguration: stub(),
  getOverkizDevices: stub(),
  updateConfiguration: stub(),
  syncOverkizDevices: stub(),
};

const req = {};

const res = {
  json: fake.returns(null),
  status: fake.returns({
    send: fake.returns(null),
  }),
};

describe('Overkiz configuration', () => {
  let overkizController;

  beforeEach(() => {
    overkizController = OverkizController(overkizService);
    sinon.reset();
  });

  it('should return configuration', async () => {
    await overkizController['get /api/v1/service/overkiz/config'].controller(req, res);
    assert.calledOnce(overkizService.getConfiguration);
  });

  it('should update configuration', async () => {
    req.body = {};
    await overkizController['post /api/v1/service/overkiz/config'].controller(req, res);
    assert.calledOnceWithExactly(overkizService.updateConfiguration, req.body);
  });
});

describe('Overkiz connect', () => {
  let overkizController;

  beforeEach(() => {
    overkizController = OverkizController(overkizService);
    sinon.reset();
  });

  it('should connect', async () => {
    await overkizController['post /api/v1/service/overkiz/connect'].controller(req, res);
    assert.calledOnce(overkizService.connect);
  });

  it('should disconnect', async () => {
    await overkizController['post /api/v1/service/overkiz/disconnect'].controller(req, res);
    assert.calledOnce(overkizService.disconnect);
  });
});

describe('Overkiz status', () => {
  let overkizController;

  beforeEach(() => {
    overkizController = OverkizController(overkizService);
    sinon.reset();
  });

  it('should get status', async () => {
    await overkizController['get /api/v1/service/overkiz/status'].controller(req, res);
    assert.calledOnce(overkizService.status);
  });
});

describe('Overkiz devices', () => {
  let overkizController;

  beforeEach(() => {
    overkizController = OverkizController(overkizService);
    sinon.reset();
  });

  it('should get discovered devices', async () => {
    await overkizController['get /api/v1/service/overkiz/discover'].controller(req, res);
    assert.calledOnce(overkizService.getOverkizDevices);
  });

  it('should synchronize discovered devices', async () => {
    await overkizController['post /api/v1/service/overkiz/discover'].controller(req, res);
    assert.calledOnce(overkizService.syncOverkizDevices);
    assert.calledOnce(overkizService.getOverkizDevices);
  });
});
