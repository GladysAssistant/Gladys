const { expect } = require('chai');

const { features } = require('../../../../services/zigbee2mqtt/utils/features');
const { loadFeatures } = require('../../../../services/zigbee2mqtt/utils/loadFeatures');

describe('Zigbee2mqtt - Utils - loadFeatures', () => {
  it('not matches existing device', async () => {
    const result = loadFeatures('name', 'model', false);
    expect(result).to.deep.eq([]);
  });

  it('not matches existing device, but with battery', async () => {
    const result = loadFeatures('name', 'model', true);
    expect(result).to.be.lengthOf(1);
    expect(result[0]).to.include(features.battery);
    expect(result[0]).to.not.have.property('id');
    expect(result[0]).to.have.property('external_id', 'zigbee2mqtt:name:battery');
    expect(result[0]).to.have.property('selector', 'zigbee2mqtt:name:battery');
  });

  it('not changes feature', async () => {
    const result = loadFeatures('name', 'model', true);

    result[0].type = 'unknown';
    expect(result[0].type).to.eq('unknown');
    expect(features.battery.type).to.eq('integer');
  });

  it('matching XIAOMI SJCGQ11LM', async () => {
    const result = loadFeatures('name', 'SJCGQ11LM', false);

    expect(result).to.be.lengthOf(1);
    expect(result[0]).to.include(features.water);
    expect(result[0]).to.not.have.property('id');
    expect(result[0]).to.have.property('external_id', 'zigbee2mqtt:name:water_leak');
    expect(result[0]).to.have.property('selector', 'zigbee2mqtt:name:water_leak');
  });

  it('matching SWAN SWO-WDS1PA', async () => {
    const result = loadFeatures('name', 'SWO-WDS1PA', true);

    expect(result).to.be.lengthOf(2);
    expect(result[0]).to.include(features.door);
    expect(result[0]).to.not.have.property('id');
    expect(result[0]).to.have.property('external_id', 'zigbee2mqtt:name:contact');
    expect(result[0]).to.have.property('selector', 'zigbee2mqtt:name:contact');
    expect(result[1]).to.include(features.battery);
    expect(result[1]).to.not.have.property('id');
    expect(result[1]).to.have.property('external_id', 'zigbee2mqtt:name:battery');
    expect(result[1]).to.have.property('selector', 'zigbee2mqtt:name:battery');
  });
});
