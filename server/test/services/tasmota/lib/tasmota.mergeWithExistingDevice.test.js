const { expect } = require('chai');
const sinon = require('sinon');

const TasmotaHandler = require('../../../../services/tasmota/lib');

describe('Tasmota - mergeWithExistingDevice', () => {
  const serviceId = 'service-uuid-random';

  it('merges discovered device with existing device', () => {
    const existing = {
      external_id: 'tasmota:device-1',
      name: 'Existing name',
      room_id: 'room-id',
      features: [],
      params: [],
    };

    const gladys = {
      stateManager: {
        get: sinon.fake.returns(existing),
      },
    };

    const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

    const device = {
      external_id: 'tasmota:device-1',
      name: 'New name',
      room_id: 'new-room',
      features: [],
      params: [],
    };

    const merged = tasmotaHandler.mergeWithExistingDevice(device);

    expect(merged.name).to.equal('Existing name');
    expect(merged.room_id).to.equal('room-id');
    expect(merged.external_id).to.equal('tasmota:device-1');
  });
});
