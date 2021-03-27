const { expect } = require('chai');
const { createDevice } = require('../../../../services/broadlink/utils/broadlink.createDevice');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

describe('Broadlink createDevice', () => {
  it('create device with 1 feature', () => {
    const device = createDevice('name', 'model', 'mac', 1, 'service');

    const externalId = `broadlink:mac`;
    expect(device).to.deep.eq({
      name: 'name',
      external_id: externalId,
      selector: externalId,
      model: 'model',
      service_id: 'service',
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      features: [
        {
          name: 'name',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: `${externalId}:0`,
          selector: `${externalId}:0`,
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
        },
      ],
    });
  });

  it('create device with 3 features', () => {
    const device = createDevice('name', 'model', 'mac', 3, 'service');

    const externalId = `broadlink:mac`;
    expect(device).to.deep.eq({
      name: 'name',
      external_id: externalId,
      selector: externalId,
      model: 'model',
      service_id: 'service',
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      features: [
        {
          name: 'name 1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: `${externalId}:0`,
          selector: `${externalId}:0`,
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
        },
        {
          name: 'name 2',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: `${externalId}:1`,
          selector: `${externalId}:1`,
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
        },
        {
          name: 'name 3',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: `${externalId}:2`,
          selector: `${externalId}:2`,
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
        },
      ],
    });
  });
});
