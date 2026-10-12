const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const PLUG_EXTERNAL_ID = 'matter:1234:1';
const INDEX_EXTERNAL_ID = 'matter:1234:1:145:energy';

const pairedPlug = () => ({
  name: 'Plug',
  external_id: PLUG_EXTERNAL_ID,
  selector: 'matter-1234-1',
  features: [
    {
      name: 'On/Off',
      external_id: 'matter:1234:1:6',
      selector: 'matter-1234-1-6',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
    {
      name: 'Energy',
      external_id: INDEX_EXTERNAL_ID,
      selector: 'matter-1234-1-145-energy',
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    },
  ],
  params: [],
});

describe('Matter.getPairedDevices', () => {
  let matterHandler;
  let gladys;
  let existingDevices;

  beforeEach(() => {
    existingDevices = {};
    gladys = {
      job: { wrapper: fake.returns(null) },
      energyPrice: { getDefaultElectricMeterFeatureId: fake.resolves('main-meter-feature-id') },
      stateManager: { get: fake((store, externalId) => existingDevices[externalId] || null) },
    };
    matterHandler = new MatterHandler(gladys, {}, {}, 'service-1');
  });

  it('should return the devices as they are when none carries an index', async () => {
    const lamp = { external_id: 'matter:1:1', features: [pairedPlug().features[0]] };
    matterHandler.devices.push(lamp);
    const devices = await matterHandler.getPairedDevices();
    expect(devices).to.deep.equal([lamp]);
    expect(gladys.energyPrice.getDefaultElectricMeterFeatureId.called).to.equal(false);
  });

  it('should derive the energy features of a new device, attached to the main meter', async () => {
    const plug = pairedPlug();
    matterHandler.devices.push(plug, { external_id: 'matter:1:1', features: [plug.features[0]] });
    const [devices] = [await matterHandler.getPairedDevices()];
    const [withEnergy, lamp] = devices;
    expect(lamp.features).to.have.lengthOf(1);
    const index = withEnergy.features.find((f) => f.external_id === INDEX_EXTERNAL_ID);
    const consumption = withEnergy.features.find((f) => f.external_id === `${INDEX_EXTERNAL_ID}_consumption`);
    const cost = withEnergy.features.find((f) => f.external_id === `${INDEX_EXTERNAL_ID}_cost`);
    expect(index.energy_parent_id).to.equal('main-meter-feature-id');
    expect(consumption.energy_parent_id).to.equal(index.id);
    expect(consumption.selector).to.equal('matter-1234-1-145-energy_consumption');
    expect(cost.energy_parent_id).to.equal(consumption.id);
    // the device held in memory is untouched
    expect(plug.features).to.have.lengthOf(2);
    expect(plug.features[1]).to.not.have.property('energy_parent_id');
  });

  it('should keep the identity and the parent of the features already in Gladys', async () => {
    existingDevices[PLUG_EXTERNAL_ID] = {
      external_id: PLUG_EXTERNAL_ID,
      features: [
        { id: 'switch-in-db', external_id: 'matter:1234:1:6', energy_parent_id: null },
        { id: 'index-in-db', external_id: INDEX_EXTERNAL_ID, energy_parent_id: 'sub-meter-feature-id' },
        {
          id: 'consumption-in-db',
          external_id: `${INDEX_EXTERNAL_ID}_consumption`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: 'index-in-db',
        },
        {
          id: 'cost-in-db',
          external_id: `${INDEX_EXTERNAL_ID}_cost`,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: 'consumption-in-db',
        },
        // the derived feature of an index no longer published is dropped
        { id: 'stale-in-db', external_id: 'matter:1234:1:145:other_cost' },
      ],
    };
    matterHandler.devices.push(pairedPlug());
    const [device] = await matterHandler.getPairedDevices();
    expect(device.features.map((f) => f.id)).to.deep.equal([
      'switch-in-db',
      'index-in-db',
      'consumption-in-db',
      'cost-in-db',
    ]);
    expect(device.features[0]).to.not.have.property('energy_parent_id');
    expect(device.features[1].energy_parent_id).to.equal('sub-meter-feature-id');
  });
});
