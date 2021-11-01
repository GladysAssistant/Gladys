const { expect } = require('chai');

const { completeFeature } = require('../../../../../services/zigbee2mqtt/utils/features/completeFeature');

describe('zigbee2mqtt completeFeature', () => {
  it(`completeFeature`, () => {
    const result = completeFeature('device name', {}, 'property');

    const expected = {
      name: 'Property',
      external_id: 'zigbee2mqtt:device name:undefined:undefined:property',
      selector: 'zigbee2mqtt-device-name-undefined-undefined-property',
    };
    expect(result).deep.eq(expected);
  });
});
