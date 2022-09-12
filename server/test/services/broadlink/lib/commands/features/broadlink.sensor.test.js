const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const sensor = require('../../../../../../services/broadlink/lib/commands/features/broadlink.sensor');

describe('broadlink.sensor', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('buildFeatures', () => {
    it('should have only sensor features', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'broadlink:mac';

      const features = sensor.buildFeatures(deviceName, deviceExternalId);

      expect(features).to.deep.eq([
        // temperature sensor
        {
          name: `${deviceName} temperature`,
          category: 'temperature-sensor',
          type: 'decimal',
          external_id: `${deviceExternalId}:temperature-sensor`,
          selector: `${deviceExternalId}:temperature-sensor`,
          min: -50,
          max: 100,
          unit: 'celsius',
          read_only: true,
          has_feedback: false,
        },
        // humidity sensor
        {
          name: `${deviceName} humidity`,
          category: 'humidity-sensor',
          type: 'decimal',
          external_id: `${deviceExternalId}:humidity-sensor`,
          selector: `${deviceExternalId}:humidity-sensor`,
          min: 0,
          max: 100,
          unit: 'percent',
          read_only: true,
          has_feedback: false,
        },
      ]);
    });
  });

  describe('poll', () => {
    it('should do nothing on no feature', async () => {
      const broadlinkDevice = {
        checkSensors: fake.resolves({ temperature: 33, humidity: 44 }),
      };
      const gladysDevice = { features: [] };

      const messages = await sensor.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([]);
      assert.calledOnceWithExactly(broadlinkDevice.checkSensors);
    });

    it('should do prepare temperature event', async () => {
      const broadlinkDevice = {
        checkSensors: fake.resolves({ temperature: 33, humidity: 44 }),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'externalId',
            category: 'temperature-sensor',
          },
        ],
      };

      const messages = await sensor.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'externalId',
          state: 33,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.checkSensors);
    });

    it('should do prepare humidity event', async () => {
      const broadlinkDevice = {
        checkSensors: fake.resolves({ temperatue: 33, humidity: 44 }),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'externalId',
            category: 'humidity-sensor',
          },
        ],
      };

      const messages = await sensor.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'externalId',
          state: 44,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.checkSensors);
    });
  });
});
