const { expect } = require('chai');
const { refineCategory } = require('../../../../services/zwavejs-ui/lib/zwaveJSUI.refineCategory');
const { COMMANDCLASS } = require('../../../../services/zwavejs-ui/lib/constants');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

describe('zwaveJSUIHandler.refineCategory', () => {
  it('should refine binary sensors', () => {
    const zwavePartialNodeValue = {
      commandClass: COMMANDCLASS.BINARY_SENSOR,
    };
    const exposed = {
      name: '',
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      },
    };

    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific = {
      sensorType: 0xff,
    };
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x02;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x03;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.CO_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x04;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.CO2_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x05;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x06;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x07;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x0a;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x0b;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x0c;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);
  });

  it('should refine alarm sensors', () => {
    const zwavePartialNodeValue = {
      commandClass: COMMANDCLASS.ALARM_SENSOR,
    };
    const exposed = {
      name: '',
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      },
    };

    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific = {
      sensorType: 0xff,
    };
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x01;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x02;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.CO_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x03;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.CO2_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x04;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR);

    exposed.feature.category = DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR;
    zwavePartialNodeValue.ccSpecific.sensorType = 0x05;
    refineCategory(exposed, zwavePartialNodeValue);
    expect(exposed.feature.category).equals(DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR);
  });
});
