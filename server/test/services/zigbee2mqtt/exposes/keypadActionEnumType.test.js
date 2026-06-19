const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { BUTTON_STATUS } = require('../../../../utils/constants');

describe('zigbee2mqtt keypad action enumType', () => {
  const expose = {
    name: 'action',
    values: ['disarm', 'arm_day_zones', 'arm_night_zones', 'arm_all_zones', 'exit_delay', 'emergency'],
  };

  [
    { enumValue: 'disarm', intValue: BUTTON_STATUS.DISARM },
    { enumValue: 'arm_day_zones', intValue: BUTTON_STATUS.ARM_DAY_ZONES },
    { enumValue: 'arm_night_zones', intValue: BUTTON_STATUS.ARM_NIGHT_ZONES },
    { enumValue: 'arm_all_zones', intValue: BUTTON_STATUS.ARM_ALL_ZONES },
    { enumValue: 'exit_delay', intValue: BUTTON_STATUS.EXIT_DELAY },
    { enumValue: 'emergency', intValue: BUTTON_STATUS.EMERGENCY },
  ].forEach((mapping) => {
    const { enumValue, intValue } = mapping;

    it(`should read ${enumValue} value as ${intValue}`, () => {
      const result = enumType.readValue(expose, enumValue);
      assert.equal(result, intValue);
    });
  });
});
