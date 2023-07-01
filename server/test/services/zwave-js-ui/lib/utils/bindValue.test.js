const { expect } = require('chai');
const { COMMAND_CLASSES, PROPERTIES } = require('../../../../../services/zwave-js-ui/lib/constants');
const { bindValue, unbindValue } = require('../../../../../services/zwave-js-ui/lib/utils/bindValue');
const { BUTTON_STATUS, STATE } = require('../../../../../utils/constants');

describe('zwave.bindValue', () => {
  it('should bindValue commandClass COMMAND_CLASS_SWITCH_BINARY', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY,
    };
    const value = 1;
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(true);
  });

  it('should bindValue commandClass COMMAND_CLASS_SWITCH_MULTILEVEL', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL,
    };
    const value = '15';
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(15);
  });

  it('should bindValue commandClass COMMAND_CLASS_NOTIFICATION ON', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
    };
    const value = '8';
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(true);
  });

  it('should bindValue commandClass COMMAND_CLASS_NOTIFICATION OFF', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
    };
    const value = '0';
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(false);
  });

  it('should bindValue commandClass other', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_BASIC,
    };
    const value = 'test';
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(value);
  });

  it('should bindValue commandClass other - Number', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_BASIC,
    };
    const value = 1;
    const bindedValue = bindValue(valueId, value);
    expect(bindedValue).to.equal(value);
  });
});

describe('zwave.unbindValue', () => {
  it('should unbindValue commandClass COMMAND_CLASS_SWITCH_BINARY', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY,
    };
    const value = true;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(1);
  });

  it('should unbindValue commandClass COMMAND_CLASS_SENSOR_BINARY', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY,
    };
    const value = false;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(0);
  });

  it('should unbindValue commandClass COMMAND_CLASS_NOTIFICATION - Motion ON', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
      fullProperty: PROPERTIES.MOTION_ALARM,
    };
    const value = 8;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(1);
  });

  it('should unbindValue commandClass COMMAND_CLASS_NOTIFICATION - Motion OFF', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
      fullProperty: PROPERTIES.MOTION_ALARM,
    };
    const value = false;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(0);
  });

  it('should unbindValue commandClass COMMAND_CLASS_NOTIFICATION - Smoke Alarm-Sensor status OFF', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
      fullProperty: PROPERTIES.SMOKE_ALARM,
    };
    const value = 0;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(STATE.OFF);
  });

  it('should unbindValue commandClass COMMAND_CLASS_NOTIFICATION - Smoke Alarm-Sensor status ON', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_NOTIFICATION,
      fullProperty: PROPERTIES.SMOKE_ALARM,
    };
    const value = 2;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(STATE.ON);
  });

  it('should unbindValue commandClass COMMAND_CLASS_CENTRAL_SCENE - empty', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE,
    };
    const value = '';
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(0);
  });

  it('should unbindValue commandClass COMMAND_CLASS_CENTRAL_SCENE - 34', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE,
    };
    const value = 23;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(BUTTON_STATUS.DOUBLE_CLICK);
  });

  it('should unbindValue commandClass COMMAND_CLASS_SCENE_ACTIVATION', () => {
    const valueId = {
      commandClass: COMMAND_CLASSES.COMMAND_CLASS_SCENE_ACTIVATION,
    };
    const value = 20;
    const unbindedValue = unbindValue(valueId, value);
    expect(unbindedValue).to.equal(BUTTON_STATUS.CLICK);
  });
});
