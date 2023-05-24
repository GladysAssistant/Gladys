const sinon = require('sinon');

const { assert, fake } = sinon;
const SunSpecController = require('../../../../services/sunspec/api/sunspec.controller');

const sunspecManager = {
  getDevices: fake.returns({}),
  connect: fake.resolves(true),
  scanNetwork: fake.resolves(true),
  disconnect: fake.resolves(true),
  getStatus: fake.returns({
    connected: true,
  }),
  getConfiguration: fake.returns({ sunspecUrl: 'sunspecUrl' }),
  updateConfiguration: fake.resolves({ sunspecUrl: 'newSunspecUrl' }),
};

describe('Devices API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunspecManager);
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
    assert.calledOnce(sunspecManager.getDevices);
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
    assert.calledOnceWithExactly(sunspecManager.getDevices, { search: 'search' });
    assert.calledOnceWithExactly(res.json, {});
  });

  it('scan for devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/sunspec/discover'].controller(req, res);
    assert.calledOnceWithExactly(sunspecManager.scanNetwork);
    assert.calledOnceWithExactly(res.json, { success: true });
  });
});

describe('Status API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunspecManager);
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
    assert.calledOnceWithExactly(sunspecManager.connect);
    assert.calledOnceWithExactly(res.json, { success: true });
  });

  it('disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/sunspec/disconnect'].controller(req, res);
    assert.calledOnceWithExactly(sunspecManager.disconnect);
    assert.calledOnceWithExactly(res.json, { success: true });
  });

  it('get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sunspec/status'].controller(req, res);
    assert.calledOnceWithExactly(sunspecManager.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('Configuration API', () => {
  let controller;

  beforeEach(() => {
    controller = SunSpecController(sunspecManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('get configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sunspec/configuration'].controller(req, res);
    assert.calledOnceWithExactly(sunspecManager.getConfiguration);
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
    sunspecManager.getConfiguration = fake.returns({ sunspecUrl: 'newSunspecUrl' });

    await controller['post /api/v1/service/sunspec/configuration'].controller(req, res);
    assert.calledOnceWithExactly(sunspecManager.updateConfiguration, { sunspecUrl: 'newSunspecUrl' });
    assert.calledOnceWithExactly(sunspecManager.disconnect);
    assert.calledOnceWithExactly(sunspecManager.connect);
    assert.calledOnceWithExactly(sunspecManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, { sunspecUrl: 'newSunspecUrl' });
  });
});
