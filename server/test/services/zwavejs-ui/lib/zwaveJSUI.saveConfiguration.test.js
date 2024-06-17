const sinon = require('sinon');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};

describe('zwaveJSUIHandler.saveConfiguration', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save mqtt configuration', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.saveConfiguration({
      mqtt_url: 'mqtt://localhost',
      mqtt_username: 'my_username',
      mqtt_password: 'my_password',
    });
    assert.calledWith(gladys.variable.setValue, 'ZWAVEJS_UI_MQTT_URL', 'mqtt://localhost', serviceId);
    assert.calledWith(gladys.variable.setValue, 'ZWAVEJS_UI_MQTT_USERNAME', 'my_username', serviceId);
    assert.calledWith(gladys.variable.setValue, 'ZWAVEJS_UI_MQTT_PASSWORD', 'my_password', serviceId);
  });
});
