const { expect } = require('chai');

const { DEVICE_TYPES } = require('../../../../../services/tuya/lib/mappings');
const { resolveCloudReadStrategy } = require('../../../../../services/tuya/lib/utils/tuya.cloudStrategy');

describe('Tuya cloud strategy utils', () => {
  it('should ignore empty cloud codes and return no strategy', () => {
    const strategy = resolveCloudReadStrategy(
      {
        specifications: {
          status: [{ code: '' }],
        },
        thing_model: {
          services: [{ properties: [{ code: '   ' }] }],
        },
      },
      DEVICE_TYPES.SMART_SOCKET,
    );

    expect(strategy).to.equal(null);
  });
});
