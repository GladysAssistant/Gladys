const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const remote = require('../../../../../../services/broadlink/lib/commands/features/broadlink.remote');
const { NoValuesFoundError } = require('../../../../../../utils/coreErrors');

describe('broadlink.remote', () => {
  const peripheral = {
    sendData: fake.resolves(null),
    mac: [11, 22, 33, 44],
  };

  afterEach(() => {
    sinon.reset();
  });

  describe('buildFeatures', () => {
    it('should have no features', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'deviceExternalId';
      const broadlinkDevice = {};

      const features = remote.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([]);
    });

    it('should have temperture feature', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'deviceExternalId';
      const broadlinkDevice = {
        checkTemperature: fake.resolves(null),
      };

      const features = remote.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([
        {
          name: `deviceName temperature`,
          category: 'temperature-sensor',
          type: 'decimal',
          external_id: 'deviceExternalId:temperature-sensor',
          selector: 'deviceExternalId:temperature-sensor',
          min: -50,
          max: 100,
          unit: 'celsius',
          read_only: true,
          has_feedback: false,
        },
      ]);

      assert.notCalled(broadlinkDevice.checkTemperature);
    });

    it('should not have temperture feature on RMPRO', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'deviceExternalId';
      const broadlinkDevice = {
        checkTemperature: fake.resolves(null),
        TYPE: 'RMPRO',
      };

      const features = remote.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([]);

      assert.notCalled(broadlinkDevice.checkTemperature);
    });

    it('should have humidity feature', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'deviceExternalId';
      const broadlinkDevice = {
        checkHumidity: fake.resolves(null),
      };

      const features = remote.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([
        {
          name: `deviceName humidity`,
          category: 'humidity-sensor',
          type: 'decimal',
          external_id: 'deviceExternalId:humidity-sensor',
          selector: 'deviceExternalId:humidity-sensor',
          min: 0,
          max: 100,
          unit: 'percent',
          read_only: true,
          has_feedback: false,
        },
      ]);

      assert.notCalled(broadlinkDevice.checkHumidity);
    });
  });

  describe('setValue', () => {
    it('send code without sub value', async () => {
      const device = {
        params: [
          {
            name: 'code_binary',
            value: '0d',
          },
        ],
      };
      const feature = {
        type: 'binary',
      };
      const value = 0;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledOnceWithExactly(peripheral.sendData, Buffer.from([13]));
    });

    it('send code with sub value', async () => {
      const device = {
        params: [
          {
            name: 'code_binary-0',
            value: '0d',
          },
        ],
      };
      const feature = {
        type: 'binary',
      };
      const value = 0;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledOnceWithExactly(peripheral.sendData, Buffer.from([13]));
    });

    it('send multiple codes', async () => {
      const device = {
        params: [
          {
            name: 'code_channel-1',
            value: '0b',
          },
          {
            name: 'code_channel-2',
            value: '0c',
          },
        ],
      };
      const feature = {
        type: 'channel',
      };
      const value = 12;

      await remote.setValue(peripheral, device, feature, value);

      assert.calledTwice(peripheral.sendData);
      assert.calledWith(peripheral.sendData, Buffer.from([11]));
      assert.calledWith(peripheral.sendData, Buffer.from([12]));
    });

    it('missing code', async () => {
      const device = {
        params: [
          {
            name: 'code_channel-1',
            value: '0b',
          },
        ],
      };
      const feature = {
        type: 'channel',
      };
      const value = 12;

      try {
        await remote.setValue(peripheral, device, feature, value);
        expect.fail();
      } catch (e) {
        expect(e).to.be.instanceOf(NoValuesFoundError);
      }

      assert.notCalled(peripheral.sendData);
    });
  });

  describe('poll', () => {
    it('should do nothing on no feature', async () => {
      const broadlinkDevice = {};
      const gladysDevice = { features: [] };

      const messages = await remote.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([]);
    });

    it('should do prepare temperature event', async () => {
      const broadlinkDevice = {
        checkTemperature: fake.resolves(33),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'externalId',
            category: 'temperature-sensor',
          },
        ],
      };

      const messages = await remote.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'externalId',
          state: 33,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.checkTemperature);
    });

    it('should do prepare humidity event', async () => {
      const broadlinkDevice = {
        checkHumidity: fake.resolves(33),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'externalId',
            category: 'humidity-sensor',
          },
        ],
      };

      const messages = await remote.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'externalId',
          state: 33,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.checkHumidity);
    });
  });
});
