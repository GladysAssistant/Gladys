const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../../server/utils/constants');

const { convertCategory } = require('../../../../services/zigbee2mqtt/utils/convertCategory');

describe('Zigbee2mqtt - Utils - convertCategory', () => {
  it('readable feature', async () => {
    const feature = {
      read_only: false,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('state');
  });

  it('convert leak / water', async () => {
    const feature = {
      read_only: true,
      category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('water_leak');
  });

  it('convert opening sensor', async () => {
    const feature = {
      read_only: true,
      category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('contact');
  });

  it('convert Button / Switch', async () => {
    const feature = {
      read_only: true,
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('click');
  });

  it('default case complex', async () => {
    const feature = {
      read_only: true,
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('humidity');
  });

  it('default case simple', async () => {
    const feature = {
      read_only: true,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    };
    const result = convertCategory(feature);
    expect(result).to.eq('switch');
  });
});
