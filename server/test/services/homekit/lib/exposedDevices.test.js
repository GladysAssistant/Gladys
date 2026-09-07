const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const {
  EXPOSURE_MODES,
  EXPOSURE_MODE_VARIABLE,
  EXPOSED_DEVICES_VARIABLE,
  getCompatibleDevices,
  getCompatibleAlarms,
  getExposedDevices,
  getExposedAlarms,
} = require('../../../../services/homekit/lib/exposedDevices');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const LAMP = {
  id: '07f16117-8556-4b50-b9f0-e190d08f8d92',
  name: 'Lampe bureau',
  selector: 'lampe-bureau',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    },
  ],
};

const SWITCH = {
  id: 'a1b2c3d4-8556-4b50-b9f0-e190d08f8d92',
  name: 'Prise salon',
  selector: 'prise-salon',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
  ],
};

const NOT_COMPATIBLE = {
  id: 'ffffffff-8556-4b50-b9f0-e190d08f8d92',
  name: 'Compteur',
  selector: 'compteur',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
    },
  ],
};

const HOUSE = { id: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55', name: 'Maison', selector: 'maison' };

const buildHandler = () => ({
  serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
  getCompatibleDevices,
  getCompatibleAlarms,
  getExposedDevices,
  getExposedAlarms,
  gladys: {
    device: {
      get: stub().resolves([LAMP, SWITCH, NOT_COMPATIBLE]),
    },
    house: {
      get: stub().resolves([HOUSE]),
    },
    variable: {
      getValue: stub().resolves(null),
    },
  },
});

describe('Exposed devices', () => {
  it('should only keep devices carrying a feature HomeKit can expose', async () => {
    const homekitHandler = buildHandler();

    const devices = await homekitHandler.getCompatibleDevices();

    expect(devices).to.have.deep.members([LAMP, SWITCH]);
  });

  it('should expose every compatible device when no mode is set', async () => {
    const homekitHandler = buildHandler();

    const devices = await homekitHandler.getExposedDevices();

    expect(devices).to.have.deep.members([LAMP, SWITCH]);
  });

  it('should expose every compatible device in "all" mode', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.ALL);

    const devices = await homekitHandler.getExposedDevices();

    expect(devices).to.have.deep.members([LAMP, SWITCH]);
  });

  it('should only expose the selected devices in "selection" mode', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSED_DEVICES_VARIABLE, homekitHandler.serviceId)
      .resolves(JSON.stringify(['lampe-bureau', 'compteur']));

    const devices = await homekitHandler.getExposedDevices();

    // "compteur" is selected but not compatible, it stays out
    expect(devices).to.have.deep.members([LAMP]);
  });

  it('should expose nothing when the selection is empty', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);

    const devices = await homekitHandler.getExposedDevices();

    expect(devices).to.deep.equal([]);
  });

  it('should expose nothing when the selection cannot be read', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSED_DEVICES_VARIABLE, homekitHandler.serviceId)
      .resolves('not json');

    const devices = await homekitHandler.getExposedDevices();

    // a broken selection must not silently expose devices the user took out
    expect(devices).to.deep.equal([]);
  });

  it('should expose nothing when the selection is not an array', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSED_DEVICES_VARIABLE, homekitHandler.serviceId)
      .resolves('{"lampe-bureau":true}');

    const devices = await homekitHandler.getExposedDevices();

    expect(devices).to.deep.equal([]);
  });
  it('should offer the alarm of every house under a selector of its own', async () => {
    const homekitHandler = buildHandler();

    const alarms = await homekitHandler.getCompatibleAlarms();

    // prefixed so it cannot collide with a device selector in the same allow list
    expect(alarms).to.eql([{ name: 'Maison', selector: 'house-alarm:maison', house: HOUSE }]);
  });

  it('should expose every alarm when no selection is made', async () => {
    const homekitHandler = buildHandler();

    const alarms = await homekitHandler.getExposedAlarms();

    expect(alarms.map(({ selector }) => selector)).to.eql(['house-alarm:maison']);
  });

  it('should leave the alarm out when the user did not pick it', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSED_DEVICES_VARIABLE, homekitHandler.serviceId)
      .resolves(JSON.stringify(['lampe-bureau']));

    // someone who does not use the Gladys alarm must be able to keep it out of the Home app, like
    // any other accessory
    expect(await homekitHandler.getExposedAlarms()).to.eql([]);
    expect((await homekitHandler.getExposedDevices()).map(({ selector }) => selector)).to.eql(['lampe-bureau']);
  });

  it('should expose the alarm when the user picked it', async () => {
    const homekitHandler = buildHandler();
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSURE_MODE_VARIABLE, homekitHandler.serviceId)
      .resolves(EXPOSURE_MODES.SELECTION);
    homekitHandler.gladys.variable.getValue
      .withArgs(EXPOSED_DEVICES_VARIABLE, homekitHandler.serviceId)
      .resolves(JSON.stringify(['house-alarm:maison']));

    expect((await homekitHandler.getExposedAlarms()).map(({ selector }) => selector)).to.eql(['house-alarm:maison']);
    expect(await homekitHandler.getExposedDevices()).to.eql([]);
  });
});
