const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { createBridge } = require('../../../../services/homekit/lib/createBridge');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const LAMP = {
  id: '07f16117-8556-4b50-b9f0-e190d08f8d92',
  name: 'Lampe bureau',
  selector: 'lampe-bureau',
  features: [{ category: DEVICE_FEATURE_CATEGORIES.LIGHT, type: DEVICE_FEATURE_TYPES.LIGHT.BINARY }],
};

const HOUSE_ALARM = {
  name: 'Maison',
  selector: 'house-alarm:maison',
  house: { id: 'e1b0a9cf', name: 'Maison', selector: 'maison' },
};

/**
 * @description Build a HomeKit handler whose bridge, accessories and Gladys calls are all stubbed.
 * @param {object} [overrides] - Handler properties to replace.
 * @returns {object} The handler, with `addBridgedAccessories` and `publish` readable on it.
 * @example
 * const handler = buildHandler({ buildAccessory: stub().throws(new Error('boom')) });
 */
function buildHandler(overrides = {}) {
  const addBridgedAccessories = stub().returns();
  const publish = stub().resolves();

  return {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    createBridge,
    addBridgedAccessories,
    publish,
    buildAccessory: stub().returns({ UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' }),
    buildAlarmAccessory: stub().returns({ UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' }),
    getExposedAlarms: stub().resolves([HOUSE_ALARM]),
    getExposedDevices: stub().resolves([LAMP]),
    gladys: {
      variable: {
        getValue: stub().resolves(null),
        setValue: stub().resolves(),
      },
      event: {
        on: stub().returns(),
      },
    },
    newUsername: stub().resolves('C4:D0:AB:12:BC:51'),
    newPinCode: stub().resolves('123-45-678'),
    notifyChange: stub().returns(),
    hap: {
      Categories: { BRIDGE: 'BRIDGE' },
      Bridge: stub().returns({
        addBridgedAccessories,
        publish,
        setupURI: stub().returns(),
      }),
      MDNSAdvertiser: { BONJOUR: 'bonjour-hap' },
    },
    ...overrides,
  };
}

describe('Create bridge', () => {
  it('should create a bridge', async () => {
    const homekitHandler = buildHandler();

    await homekitHandler.createBridge();

    expect(homekitHandler.hap.Bridge.args[0][0]).to.equal('Gladys');
    expect(homekitHandler.hap.Bridge.args[0][1]).not.equal(null);
    // the house alarm is exposed alongside the devices, and is indexed by selector so an alarm
    // event can find its accessory again
    expect(homekitHandler.addBridgedAccessories.args[0][0]).to.deep.members([
      { UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' },
      { UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' },
    ]);
    expect(homekitHandler.alarmAccessories.get('maison')).to.eql({ UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' });
    expect(homekitHandler.publish.args[0][0]).to.eql({
      username: 'C4:D0:AB:12:BC:51',
      pincode: '123-45-678',
      port: '47129',
      category: 'BRIDGE',
      advertiser: 'bonjour-hap',
    });
  });

  it('should expose the other devices when one of them cannot be built', async () => {
    const brokenDevice = { ...LAMP, id: '5b2b0ea1-5a25-4b6a-9a4c-1a6ba0f4b9c1', selector: 'detecteur-cave' };
    const homekitHandler = buildHandler({
      getExposedDevices: stub().resolves([brokenDevice, LAMP]),
      buildAccessory: stub()
        .onFirstCall()
        .throws(new Error('Cannot add a Service with the same UUID'))
        .onSecondCall()
        .returns({ UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' }),
    });

    await homekitHandler.createBridge();

    // the bridge is published all the same, with only the device that threw left out of it
    expect(homekitHandler.addBridgedAccessories.args[0][0]).to.deep.members([
      { UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' },
      { UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' },
    ]);
    expect(homekitHandler.publish.callCount).to.equal(1);
  });

  it('should keep the bridge under the HomeKit accessory limit', async () => {
    const devices = Array.from({ length: 200 }, (unused, i) => ({ ...LAMP, selector: `lampe-${i}` }));
    let built = 0;
    const homekitHandler = buildHandler({
      getExposedDevices: stub().resolves(devices),
      buildAccessory: stub().callsFake(() => {
        built += 1;

        return { UUID: `device-${built}` };
      }),
    });

    const loggerWarn = stub(logger, 'warn');

    try {
      await homekitHandler.createBridge();
    } finally {
      loggerWarn.restore();
    }

    // 149 is what HAP takes, and the house alarm is one of them rather than the one left out
    const bridged = homekitHandler.addBridgedAccessories.args[0][0];
    expect(bridged.length).to.equal(149);
    expect(bridged[bridged.length - 1]).to.eql({ UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' });
    expect(homekitHandler.alarmAccessories.get('maison')).to.eql({ UUID: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55' });
    expect(homekitHandler.publish.callCount).to.equal(1);
    // the devices left out are named, not just counted: a count alone does not say which tiles went
    expect(loggerWarn.callCount).to.equal(1);
    expect(loggerWarn.args[0][0]).to.contain('lampe-148');
    expect(loggerWarn.args[0][0]).to.contain('lampe-199');
    expect(loggerWarn.args[0][0]).to.not.contain('lampe-147,');
  });

  it('should expose the devices when the alarm of a house cannot be built', async () => {
    const homekitHandler = buildHandler({
      buildAlarmAccessory: stub().throws(new Error('boom')),
    });

    await homekitHandler.createBridge();

    expect(homekitHandler.addBridgedAccessories.args[0][0]).to.deep.members([
      { UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' },
    ]);
    expect(homekitHandler.alarmAccessories.get('maison')).to.equal(undefined);
    expect(homekitHandler.publish.callCount).to.equal(1);
  });
});
