const sinon = require('sinon');

const { assert, fake } = sinon;
const LANManagerController = require('../../../../services/lan-manager/api/lan-manager.controller');

const lanManager = {
  getDiscoveredDevices: fake.returns(true),
  scan: fake.resolves(true),
  stop: fake.resolves(true),
  getStatus: fake.returns(true),
  getConfiguration: fake.returns({ config: true }),
  saveConfiguration: fake.resolves({ config: true }),
};

describe('GET /api/v1/service/lan-manager/discover', () => {
  let controller;

  beforeEach(() => {
    controller = LANManagerController(lanManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('getDiscoveredDevices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/lan-manager/discover'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.getDiscoveredDevices, {});
    assert.calledOnce(res.json);
  });

  it('getDiscoveredDevices with query', async () => {
    const req = {
      query: { filterAlreadyAdded: true },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/lan-manager/discover'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.getDiscoveredDevices, { filterAlreadyAdded: true });
    assert.calledOnceWithExactly(res.json, true);
  });
});

describe('POST /api/v1/service/lan-manager/discover', () => {
  let controller;

  beforeEach(() => {
    controller = LANManagerController(lanManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('scan for devices', async () => {
    const req = {
      body: {
        scan: 'on',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/lan-manager/discover'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.scan);
    assert.notCalled(lanManager.stop);
    assert.calledOnceWithExactly(res.json, true);
  });

  it('stop scan for devices', async () => {
    const req = {
      body: {
        scan: 'off',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/lan-manager/discover'].controller(req, res);
    assert.notCalled(lanManager.scan);
    assert.calledOnceWithExactly(lanManager.stop);
    assert.calledOnceWithExactly(res.json, true);
  });
});

describe('GET /api/v1/service/lan-manager/status', () => {
  let controller;

  beforeEach(() => {
    controller = LANManagerController(lanManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/lan-manager/status'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/lan-manager/config', () => {
  let controller;

  beforeEach(() => {
    controller = LANManagerController(lanManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('get config', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/lan-manager/config'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, { config: true });
  });
});

describe('GET /api/v1/service/lan-manager/config', () => {
  let controller;

  beforeEach(() => {
    controller = LANManagerController(lanManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('save config status', async () => {
    const req = {
      body: {
        config: 'new-config',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/lan-manager/config'].controller(req, res);
    assert.calledOnceWithExactly(lanManager.saveConfiguration, { config: 'new-config' });
    assert.calledOnceWithExactly(res.json, { config: true });
  });
});
