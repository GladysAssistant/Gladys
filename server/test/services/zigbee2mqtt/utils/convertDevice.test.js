const { expect } = require('chai');

const { features } = require('../../../../services/zigbee2mqtt/utils/features');
const { convertDevice } = require('../../../../services/zigbee2mqtt/utils/convertDevice');

const serviceId = '6a37dd9d-48c7-4d09-a7bb-33f257edb78d';

describe('Zigbee2mqtt - Utils - convertDevice', () => {
  it('not matches existing device', async () => {
    const mqttDevice = {
      friendly_name: 'name',
      model: 'model',
      powerSource: 'power',
    };
    const result = convertDevice(mqttDevice, serviceId);
    expect(result).to.eq(null);
  });

  it('not matches existing device, but with battery', async () => {
    const mqttDevice = {
      friendly_name: 'name',
      model: 'model',
      powerSource: 'Battery',
    };
    const result = convertDevice(mqttDevice, serviceId);

    expect(result).to.not.have.property('id');
    expect(result).to.have.property('name', 'name');
    expect(result).to.have.property('external_id', 'zigbee2mqtt:name');
    expect(result).to.have.property('model', 'model');
    expect(result).to.have.property('should_poll', false);
    expect(result).to.have.property('service_id', serviceId);

    expect(result.features).to.be.lengthOf(1);
    expect(result.features[0]).to.include(features.battery);
    expect(result.features[0]).to.not.have.property('id');
    expect(result.features[0]).to.have.property('external_id', 'zigbee2mqtt:name:battery');
    expect(result.features[0]).to.have.property('selector', 'zigbee2mqtt:name:battery');
  });

  it('matching XIAOMI WXKG01LM', async () => {
    const mqttDevice = {
      friendly_name: 'name',
      model: 'WXKG01LM',
      powerSource: 'none',
    };
    const result = convertDevice(mqttDevice, serviceId);

    expect(result).to.not.have.property('id');
    expect(result).to.have.property('name', 'name');
    expect(result).to.have.property('external_id', 'zigbee2mqtt:name');
    expect(result).to.have.property('model', 'WXKG01LM');
    expect(result).to.have.property('should_poll', false);
    expect(result).to.have.property('service_id', serviceId);

    expect(result.features).to.be.lengthOf(1);
    expect(result.features[0]).to.include(features.switch_sensor);
    expect(result.features[0]).to.not.have.property('id');
    expect(result.features[0]).to.have.property('external_id', 'zigbee2mqtt:name:switch');
    expect(result.features[0]).to.have.property('selector', 'zigbee2mqtt:name:switch');
  });

  it('matching SWAN SWO-WDS1PA', async () => {
    const mqttDevice = {
      friendly_name: 'name',
      model: 'SWO-WDS1PA',
      powerSource: 'Battery',
    };
    const result = convertDevice(mqttDevice, serviceId);

    expect(result).to.not.have.property('id');
    expect(result).to.have.property('name', 'name');
    expect(result).to.have.property('external_id', 'zigbee2mqtt:name');
    expect(result).to.have.property('model', 'SWO-WDS1PA');
    expect(result).to.have.property('should_poll', false);
    expect(result).to.have.property('service_id', serviceId);

    expect(result.features).to.be.lengthOf(2);
    expect(result.features[0]).to.include(features.door);
    expect(result.features[0]).to.not.have.property('id');
    expect(result.features[0]).to.have.property('external_id', 'zigbee2mqtt:name:contact');
    expect(result.features[0]).to.have.property('selector', 'zigbee2mqtt:name:contact');
    expect(result.features[1]).to.include(features.battery);
    expect(result.features[1]).to.not.have.property('id');
    expect(result.features[1]).to.have.property('external_id', 'zigbee2mqtt:name:battery');
    expect(result.features[1]).to.have.property('selector', 'zigbee2mqtt:name:battery');
  });
});
