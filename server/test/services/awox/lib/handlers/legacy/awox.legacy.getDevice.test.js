const { expect } = require('chai');
const sinon = require('sinon');

const AwoxLegacyManager = require('../../../../../../services/awox/lib/handlers/legacy');

describe('awox.legacy.getDevice', () => {
  const bluetooth = {};
  const gladys = {};
  let manager;

  beforeEach(() => {
    manager = new AwoxLegacyManager(gladys, bluetooth);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device not match any group', async () => {
    const device = {};

    const result = await manager.getDevice(device);

    expect(result).deep.eq({
      features: [],
    });
  });

  it('device model matches white group', async () => {
    const device = { model: 'SML-w7' };

    const result = await manager.getDevice(device);

    expect(result).deep.eq({
      model: 'SML-w7',
      features: [
        {
          category: 'light',
          max: 1,
          min: 0,
          type: 'binary',
          read_only: false,
          name: 'Switch',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'brightness',
          read_only: false,
          name: 'Brightness',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'temperature',
          read_only: false,
          name: 'Color temperature',
          has_feedback: true,
        },
      ],
    });
  });

  it('device name matches white group', async () => {
    const device = { name: 'SML_w7' };

    const result = await manager.getDevice(device);

    expect(result).deep.eq({
      name: 'SML_w7',
      features: [
        {
          category: 'light',
          max: 1,
          min: 0,
          type: 'binary',
          read_only: false,
          name: 'Switch',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'brightness',
          read_only: false,
          name: 'Brightness',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'temperature',
          read_only: false,
          name: 'Color temperature',
          has_feedback: true,
        },
      ],
    });
  });

  it('device model matches color group', async () => {
    const device = { model: 'SML-c9' };

    const result = await manager.getDevice(device);

    expect(result).deep.eq({
      model: 'SML-c9',
      features: [
        {
          category: 'light',
          max: 1,
          min: 0,
          type: 'binary',
          read_only: false,
          name: 'Switch',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'brightness',
          read_only: false,
          name: 'Brightness',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'temperature',
          read_only: false,
          name: 'Color temperature',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 16777215,
          min: 0,
          type: 'color',
          read_only: false,
          name: 'Color',
          has_feedback: true,
        },
      ],
    });
  });

  it('device name matches color group', async () => {
    const device = { name: 'SML_c9' };

    const result = await manager.getDevice(device);

    expect(result).deep.eq({
      name: 'SML_c9',
      features: [
        {
          category: 'light',
          max: 1,
          min: 0,
          type: 'binary',
          read_only: false,
          name: 'Switch',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'brightness',
          read_only: false,
          name: 'Brightness',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 100,
          min: 0,
          type: 'temperature',
          read_only: false,
          name: 'Color temperature',
          has_feedback: true,
        },
        {
          category: 'light',
          max: 16777215,
          min: 0,
          type: 'color',
          read_only: false,
          name: 'Color',
          has_feedback: true,
        },
      ],
    });
  });
});
