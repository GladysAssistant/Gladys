const sinon = require('sinon');

const { assert, fake } = sinon;
const SunSpecController = require('../../../../services/sunspec/api/sunspec.controller');

const sunSpecManager = {
  getDevices: fake.returns({}),
  connect: fake.resolves(true),
  scanNetwork: fake.resolves(true),
  disconnect: fake.resolves(true),
  getStatus: fake.returns({
    connected: true,
  }),
  getConfiguration: fake.returns({ sunspecUrl: 'sunspecUrl' }),
  updateConfiguration: fake.resolves({ sunspecUrl: 'newSunspecUrl' }),
  bdpvInit: fake.resolves(null),
};

describe('Devices API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunSpecManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('getDevices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sunspec/discover'].controller(req, res);
    assert.calledOnce(sunSpecManager.getDevices);
    assert.calledOnceWithExactly(res.json, {});
  });

  it('getDevices with query', async () => {
    const req = {
      query: { search: 'search' },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sunspec/discover'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.getDevices, { search: 'search' });
    assert.calledOnceWithExactly(res.json, {});
  });

  it('scan for devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/sunspec/discover'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.scanNetwork);
    assert.calledOnceWithExactly(res.json, { success: true });
  });
});

describe('Status API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunSpecManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/sunspec/connect'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.connect);
    assert.calledOnceWithExactly(res.json, { success: true });
  });

  it('disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/sunspec/disconnect'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.disconnect);
    assert.calledOnceWithExactly(res.json, { success: true });
  });

  it('get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sunspec/status'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('Configuration API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunSpecManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('get configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/sunspec/config'].controller(req, res);
    assert.calledOnce(sunSpecManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, { sunspecUrl: 'sunspecUrl' });
  });

  it('update configuration', async () => {
    const req = {
      body: {
        sunspecUrl: 'newSunspecUrl',
      },
    };
    const res = {
      json: fake.returns(null),
    };
    sunSpecManager.getConfiguration = fake.returns({ sunspecUrl: 'newSunspecUrl' });

    await controller['post /api/v1/service/sunspec/config'].controller(req, res);
    assert.calledOnceWithExactly(sunSpecManager.updateConfiguration, { sunspecUrl: 'newSunspecUrl' });
    assert.calledOnce(sunSpecManager.disconnect);
    assert.calledOnce(sunSpecManager.connect);
    assert.calledOnce(sunSpecManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, { sunspecUrl: 'newSunspecUrl' });
  });
});
