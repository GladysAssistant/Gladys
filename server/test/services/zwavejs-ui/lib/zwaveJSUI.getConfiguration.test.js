const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('zwaveJSUIHandler.getConfiguration', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get mqtt configuration', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('toto'),
      },
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    const config = await zwaveJSUIHandler.getConfiguration();
    expect(config).to.deep.equal({
      mqtt_url: 'toto',
      mqtt_username: 'toto',
      mqtt_password: 'toto',
    });
  });
  it('should return null values', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    const config = await zwaveJSUIHandler.getConfiguration();
    expect(config).to.deep.equal({
      mqtt_url: null,
      mqtt_username: null,
      mqtt_password: null,
    });
  });
});
