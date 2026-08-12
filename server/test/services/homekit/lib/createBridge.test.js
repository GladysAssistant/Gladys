const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { createBridge } = require('../../../../services/homekit/lib/createBridge');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

describe('Create bridge', () => {
  it('should create a bridge', async () => {
    const addBridgedAccessories = stub().returns();
    const publish = stub().resolves();
    const homekitHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      createBridge,
      buildAccessory: stub().returns({ UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' }),
      getExposedDevices: stub().resolves([
        {
          id: '07f16117-8556-4b50-b9f0-e190d08f8d92',
          name: 'Lampe bureau',
          selector: 'lampe-bureau',
          features: [{ category: DEVICE_FEATURE_CATEGORIES.LIGHT, type: DEVICE_FEATURE_TYPES.LIGHT.BINARY }],
        },
      ]),
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
    };

    await homekitHandler.createBridge();

    expect(homekitHandler.hap.Bridge.args[0][0]).to.equal('Gladys');
    expect(homekitHandler.hap.Bridge.args[0][1]).not.equal(null);
    expect(addBridgedAccessories.args[0][0]).to.deep.members([{ UUID: '78a7b724-18e8-4c15-ab30-c8486c253f36' }]);
    expect(publish.args[0][0]).to.eql({
      username: 'C4:D0:AB:12:BC:51',
      pincode: '123-45-678',
      port: '47129',
      category: 'BRIDGE',
      advertiser: 'bonjour-hap',
    });
  });
});
