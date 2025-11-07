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

  it(`completeFeature with custom name`, () => {
    const result = completeFeature('device name', { name: 'Custom Name' }, 'property');

    const expected = {
      name: 'Custom Name',
      external_id: 'zigbee2mqtt:device name:undefined:undefined:property',
      selector: 'zigbee2mqtt-device-name-undefined-undefined-property',
    };
    expect(result).deep.eq(expected);
  });

  it(`completeFeature with custom name and suffix`, () => {
    const result = completeFeature('device name', { name: 'Custom Name' }, 'property', 2);

    const expected = {
      name: 'Custom Name 2',
      external_id: 'zigbee2mqtt:device name:undefined:undefined:property:2',
      selector: 'zigbee2mqtt-device-name-undefined-undefined-property-2',
    };
    expect(result).deep.eq(expected);
  });
});
