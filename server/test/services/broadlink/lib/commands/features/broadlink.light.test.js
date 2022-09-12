const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const light = require('../../../../../../services/broadlink/lib/commands/features/broadlink.light');

describe('broadlink.light', () => {
  let peripheral;

  beforeEach(() => {
    peripheral = {
      setState: fake.resolves(null),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('buildFeatures', () => {
    it('should have no features', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'deviceExternalId';

      const features = light.buildFeatures(deviceName, deviceExternalId);

      expect(features).to.deep.eq([
        // light switch
        {
          name: `${deviceName}`,
          category: 'light',
          type: 'binary',
          external_id: `${deviceExternalId}:light:binary`,
          selector: `${deviceExternalId}:light:binary`,
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
        // light color
        {
          name: `${deviceName} color`,
          category: 'light',
          type: 'color',
          external_id: `${deviceExternalId}:light:color`,
          selector: `${deviceExternalId}:light:color`,
          min: 1,
          max: 16777215,
          read_only: false,
          has_feedback: false,
        },
        // light brightness
        {
          name: `${deviceName} brightness`,
          category: 'light',
          type: 'brightness',
          external_id: `${deviceExternalId}:light:brightness`,
          selector: `${deviceExternalId}:light:brightness`,
          min: 0,
          max: 100,
          unit: 'percent',
          read_only: false,
          has_feedback: false,
        },
        // light temperature
        {
          name: `${deviceName} temperature`,
          category: 'light',
          type: 'temperature',
          external_id: `${deviceExternalId}:light:temperature`,
          selector: `${deviceExternalId}:light:temperature`,
          min: 0,
          max: 100,
          unit: 'percent',
          read_only: false,
          has_feedback: false,
        },
      ]);
    });
  });

  describe('setValue', () => {
    it('should power off', async () => {
      const feature = {
        type: 'binary',
      };
      const value = 0;

      await light.setValue(peripheral, null, feature, value);

      assert.calledOnceWithExactly(peripheral.setState, { pwr: false });
    });

    it('should power on', async () => {
      const feature = {
        type: 'binary',
      };
      const value = 1;

      await light.setValue(peripheral, null, feature, value);

      assert.calledOnceWithExactly(peripheral.setState, { pwr: true });
    });

    it('should change color', async () => {
      const feature = {
        type: 'color',
      };
      const value = 16711900;

      await light.setValue(peripheral, null, feature, value);

      assert.calledOnceWithExactly(peripheral.setState, { red: 255, blue: 0, green: 220 });
    });

    it('should change brightness', async () => {
      const feature = {
        type: 'brightness',
      };
      const value = 17;

      await light.setValue(peripheral, null, feature, value);

      assert.calledOnceWithExactly(peripheral.setState, { brightness: 17 });
    });

    it('should change temperature', async () => {
      const feature = {
        type: 'temperature',
      };
      const value = 67;

      await light.setValue(peripheral, null, feature, value);

      assert.calledOnceWithExactly(peripheral.setState, { colortemp: 67 });
    });
  });
});
