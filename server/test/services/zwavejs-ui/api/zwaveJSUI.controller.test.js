const sinon = require('sinon');
const ZwaveJSUIController = require('../../../../services/zwavejs-ui/api/zwaveJSUI.controller');

const { assert, fake } = sinon;

const zwaveJSUIHandler = {
  scan: fake.resolves(null),
  connect: fake.resolves(null),
  saveConfiguration: fake.resolves(null),
  devices: [{ name: 'toto' }],
  getConfiguration: fake.resolves({
    mqtt_url: 'mqtt://localhost',
    mqtt_username: 'my_username',
    mqtt_password: 'my_password',
  }),
  configured: true,
  connected: false,
};

describe('ZwaveJSUIController', () => {
  let controller;

  beforeEach(() => {
    controller = ZwaveJSUIController(zwaveJSUIHandler);
    sinon.reset();
  });

  it('should call scan function', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/zwavejs-ui/discover'].controller(req, res);
    assert.calledOnce(zwaveJSUIHandler.scan);
    assert.calledWith(res.json, { success: true });
  });
  it('should call connect function', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/zwavejs-ui/connect'].controller(req, res);
    assert.calledOnce(zwaveJSUIHandler.connect);
    assert.calledWith(res.json, { success: true });
  });
  it('should call saveConfiguration function', async () => {
    const req = {
      body: {
        mqtt_url: 'mqtt://localhost',
        mqtt_username: 'my_username',
        mqtt_password: 'my_password',
      },
    };
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/zwavejs-ui/configuration'].controller(req, res);
    assert.calledWith(zwaveJSUIHandler.saveConfiguration, req.body);
    assert.calledWith(res.json, { success: true });
  });
  it('should get configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/zwavejs-ui/configuration'].controller(req, res);
    assert.called(zwaveJSUIHandler.getConfiguration);
    assert.calledWith(res.json, {
      mqtt_url: 'mqtt://localhost',
      mqtt_username: 'my_username',
      mqtt_password: 'my_password',
    });
  });
  it('should call getNodes function', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/zwavejs-ui/node'].controller(req, res);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should call getStatus function', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/zwavejs-ui/status'].controller(req, res);
    assert.calledWith(res.json, { configured: true, connected: false });
  });
});
