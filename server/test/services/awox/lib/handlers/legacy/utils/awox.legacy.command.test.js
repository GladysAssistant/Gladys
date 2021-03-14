const { expect } = require('chai');

const { command } = require('../../../../../../../services/awox/lib/handlers/legacy/utils/awox.legacy.command');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../../utils/constants');
const { BadParameters } = require('../../../../../../../utils/coreErrors');

describe('awox.legacy.command', () => {
  it('unknwon category', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
      type: DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
    };
    const value = 1;
    try {
      command(feature, value);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });

  it('button category / invalid type', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
    };
    const value = 1;
    try {
      command(feature, value);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });

  it('button light / invalid type', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
    };
    const value = 1;
    try {
      command(feature, value);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
  });

  it('light category / binary type (value = 0)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 0;

    const result = command(feature, value);
    const expected = { code: 0x0a, message: [value] };
    expect(result).deep.eq(expected);
  });

  it('light category / binary type (value = 1)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 1;

    const result = command(feature, value);
    const expected = { code: 0x0a, message: [value] };
    expect(result).deep.eq(expected);
  });

  it('light category / temperature type (value = 0)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };
    const value = 0;

    const result = command(feature, value);
    const expected = { code: 0x0e, message: [0x02] };
    expect(result).deep.eq(expected);
  });

  it('light category / temperature type (value = 25)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };
    const value = 25;

    const result = command(feature, value);
    const expected = { code: 0x0e, message: [0x04] };
    expect(result).deep.eq(expected);
  });

  it('light category / temperature type (value = 50)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };
    const value = 50;

    const result = command(feature, value);
    const expected = { code: 0x0e, message: [0x07] };
    expect(result).deep.eq(expected);
  });

  it('light category / temperature type (value = 75)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };
    const value = 75;

    const result = command(feature, value);
    const expected = { code: 0x0e, message: [0x09] };
    expect(result).deep.eq(expected);
  });

  it('light category / temperature type (value = 100)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    };
    const value = 100;

    const result = command(feature, value);
    const expected = { code: 0x0e, message: [0x0b] };
    expect(result).deep.eq(expected);
  });

  it('light category / brightness type (value = 0)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 0;

    const result = command(feature, value);
    const expected = { code: 0x0c, message: [0x02] };
    expect(result).deep.eq(expected);
  });

  it('light category / brightness type (value = 25)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 25;

    const result = command(feature, value);
    const expected = { code: 0x0c, message: [0x04] };
    expect(result).deep.eq(expected);
  });

  it('light category / brightness type (value = 50)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 50;

    const result = command(feature, value);
    const expected = { code: 0x0c, message: [0x07] };
    expect(result).deep.eq(expected);
  });

  it('light category / brightness type (value = 75)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 75;

    const result = command(feature, value);
    const expected = { code: 0x0c, message: [0x09] };
    expect(result).deep.eq(expected);
  });

  it('light category / brightness type (value = 100)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 100;

    const result = command(feature, value);
    const expected = { code: 0x0c, message: [0x0b] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 0 - black)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 0;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x02, 0x00, 0x00, 0x00, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 16.777.215 - white)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16777215;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0xff, 0xff, 0xff, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 16.711.680 - red)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16711680;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0x00, 0x00, 0xff, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 65.280 - green)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 65280;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0x00, 0xff, 0x00, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 255 - blue)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 255;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0xff, 0x00, 0x00, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 16.776.960 - yellow)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16776960;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0x00, 0xff, 0xff, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 65.535 - cyan)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 65535;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0xff, 0xff, 0x00, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 16.711.935 - magenta)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16711935;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0xff, 0x00, 0xff, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });

  it('light category / color type (value = 8.355.711 - grey)', async () => {
    const feature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 8355711;

    const result = command(feature, value);
    const expected = { code: 0x0d, message: [0x01, 0x7f, 0x7f, 0x7f, 0x00, 0x00] };
    expect(result).deep.eq(expected);
  });
});
