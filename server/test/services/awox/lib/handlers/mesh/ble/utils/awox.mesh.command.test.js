const { expect } = require('chai');

const { command } = require('../../../../../../../../services/awox/lib/handlers/mesh/ble/utils/awox.mesh.ble.command');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../../../utils/constants');
const { BadParameters } = require('../../../../../../../../utils/coreErrors');

describe('awox.mesh.commands.command', () => {
  it('Unknwon feature category', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    };

    const value = 5;
    try {
      command(feature, value);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });

  it('Unknwon feature type', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
    };

    const value = 5;
    try {
      command(feature, value);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });

  it('Device (light/binary) with value = 0', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };

    const value = 0;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xd0], message: [0x00] });
  });

  it('Device (light/binary) with value = 1', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };

    const value = 1;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xd0], message: [0x01] });
  });

  it('Device (light/color) with value = 0 (black)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 0;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0x00, 0x00, 0x00] });
  });

  it('Device (light/color) with value = 16.777.215 (white)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 16777215;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0xff, 0xff, 0xff] });
  });

  it('Device (light/color) with value = 16.711.680 (red)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 16711680;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0x00, 0x00, 0xff] });
  });

  it('Device (light/color) with value = 65.280 (green)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 65280;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0x00, 0xff, 0x00] });
  });

  it('Device (light/color) with value = 255 (blue)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 255;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0xff, 0x00, 0x00] });
  });

  it('Device (light/color) with value = 16.776.960 (yellow)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 16776960;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0x00, 0xff, 0xff] });
  });

  it('Device (light/color) with value = 65.535 (cyan)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 65535;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0xff, 0xff, 0x00] });
  });

  it('Device (light/color) with value = 16.711.935 (magenta)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 16711935;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0xff, 0x00, 0xff] });
  });

  it('Device (light/color) with value = 8.355.711 (grey)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 8355711;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xe2], message: [0x04, 0x7f, 0x7f, 0x7f] });
  });

  it('Device (light/temperature) with value = 100 (max)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };

    const value = 100;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xf0], message: [0x7f] });
  });

  it('Device (light/brightness) with value = 100 (max)', () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };

    const value = 100;
    const generatedCommand = command(feature, value);
    expect(generatedCommand).deep.eq({ code: [0xf1], message: [0x7f] });
  });
});
