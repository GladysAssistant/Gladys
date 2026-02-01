const { expect } = require('chai');
const sinon = require('sinon');

const TasmotaHandler = require('../../../../services/tasmota/lib');
const { EVENTS } = require('../../../../utils/constants');

describe('Tasmota - notifyNewDevice', () => {
  let tasmotaHandler;
  let gladys;
  const serviceId = 'service-uuid-random';

  beforeEach(() => {
    gladys = {
      energyPrice: {
        getDefaultElectricMeterFeatureId: sinon.fake.resolves('default-energy-feature-id'),
      },
      stateManager: {
        get: sinon.fake.returns(undefined),
      },
      event: {
        emit: sinon.fake(),
      },
    };
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('adds energy features on websocket payload for total energy index', async () => {
    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: 'energy-sensor',
          type: 'energy',
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };

    await tasmotaHandler.notifyNewDevice(device, 'test.event');

    sinon.assert.calledOnce(gladys.event.emit);
    const payload = gladys.event.emit.firstCall.args[1].payload;
    const consumptionFeature = payload.features.find((f) => f.external_id.endsWith('_consumption'));
    const costFeature = payload.features.find((f) => f.external_id.endsWith('_cost'));
    expect(consumptionFeature).to.exist;
    expect(costFeature).to.exist;
  });

  it('preserves existing derived features in websocket payload', async () => {
    const existing = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: 'energy-sensor',
          type: 'energy',
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          name: 'Energy total (consumption)',
          category: 'energy-sensor',
          type: 'thirty-minutes-consumption',
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          selector: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          name: 'Energy total (cost)',
          category: 'energy-sensor',
          type: 'thirty-minutes-consumption-cost',
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          selector: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
    };

    gladys.stateManager.get = sinon.fake.returns(existing);

    const device = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: 'energy-sensor',
          type: 'energy',
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };

    await tasmotaHandler.notifyNewDevice(device, 'test.event');

    const payload = gladys.event.emit.firstCall.args[1].payload;
    const preservedConsumption = payload.features.find(
      (f) => f.external_id === 'tasmota:device-1:ENERGY:Total:consumption',
    );
    const preservedCost = payload.features.find((f) => f.external_id === 'tasmota:device-1:ENERGY:Total:cost');
    expect(preservedConsumption).to.exist;
    expect(preservedCost).to.exist;
  });

  it('emits websocket payload', async () => {
    const device = {
      external_id: 'tasmota:device-1',
      features: [],
    };

    await tasmotaHandler.notifyNewDevice(device, 'test.event');

    sinon.assert.calledOnce(gladys.event.emit);
    expect(gladys.event.emit.firstCall.args[0]).to.eq(EVENTS.WEBSOCKET.SEND_ALL);
  });

  it('falls back to mergeWithExistingDevice when an error occurs', async () => {
    const device = {
      external_id: 'tasmota:device-1',
      features: [],
    };
    const fallbackPayload = { external_id: 'fallback' };
    tasmotaHandler.mergeWithExistingDevice = sinon.fake.returns(fallbackPayload);
    gladys.energyPrice.getDefaultElectricMeterFeatureId = sinon.fake.throws(new Error('boom'));

    await tasmotaHandler.notifyNewDevice(device, 'test.event');

    sinon.assert.calledOnce(tasmotaHandler.mergeWithExistingDevice);
    expect(gladys.event.emit.firstCall.args[1].payload).to.eq(fallbackPayload);
  });
});
