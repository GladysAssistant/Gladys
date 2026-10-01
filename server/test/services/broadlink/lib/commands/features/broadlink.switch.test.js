const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const switchDevice = require('../../../../../../services/broadlink/lib/commands/features/broadlink.switch');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../utils/constants');

const SP4_TYPES = ['SP4', 'SP4B'];

describe('broadlink.switch', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('buildFeatures', () => {
    it('should have only 1 feature', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'broadlink:mac';
      const broadlinkDevice = {};

      const features = switchDevice.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([
        {
          name: `${deviceName}`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:1',
          selector: 'broadlink:mac:switch:1',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
      ]);
    });

    it('should have only 4 features', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'broadlink:mac';
      const broadlinkDevice = { TYPE: 'MP1' };

      const features = switchDevice.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([
        {
          name: `${deviceName} 1`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:1',
          selector: 'broadlink:mac:switch:1',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
        {
          name: `${deviceName} 2`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:2',
          selector: 'broadlink:mac:switch:2',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
        {
          name: `${deviceName} 3`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:3',
          selector: 'broadlink:mac:switch:3',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
        {
          name: `${deviceName} 4`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:4',
          selector: 'broadlink:mac:switch:4',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
      ]);
    });

    it('should have energy feature', () => {
      const deviceName = 'deviceName';
      const deviceExternalId = 'broadlink:mac';
      const broadlinkDevice = { getEnergy: fake.resolves(null) };

      const features = switchDevice.buildFeatures(deviceName, deviceExternalId, broadlinkDevice);

      expect(features).to.deep.eq([
        {
          name: `${deviceName}`,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'broadlink:mac:switch:1',
          selector: 'broadlink:mac:switch:1',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: false,
        },
        {
          name: `${deviceName} energy`,
          category: 'energy-sensor',
          type: 'energy',
          external_id: 'broadlink:mac:energy-sensor',
          selector: 'broadlink:mac:energy-sensor',
          min: 0,
          max: 1000,
          unit: 'watt',
          read_only: true,
          has_feedback: false,
        },
      ]);

      assert.notCalled(broadlinkDevice.getEnergy);
    });
  });

  describe('setValue', () => {
    it('should power off', async () => {
      const broadlinkDevice = { setPower: fake.resolves(null) };
      const gladysDevice = {};
      const value = 0;

      await switchDevice.setValue(broadlinkDevice, null, gladysDevice, value);

      assert.calledOnceWithExactly(broadlinkDevice.setPower, false);
    });

    it('should power on', async () => {
      const broadlinkDevice = { setPower: fake.resolves(null) };
      const gladysDevice = {};
      const value = 1;

      await switchDevice.setValue(broadlinkDevice, null, gladysDevice, value);

      assert.calledOnceWithExactly(broadlinkDevice.setPower, true);
    });

    it('should power off another channel', async () => {
      const broadlinkDevice = { setPower: fake.resolves(null), TYPE: 'MP1' };
      const gladysDevice = { external_id: 'broadlink:mac:switch:2' };
      const value = 0;

      await switchDevice.setValue(broadlinkDevice, null, gladysDevice, value);

      assert.calledOnceWithExactly(broadlinkDevice.setPower, 2, false);
    });

    it('should power on', async () => {
      const broadlinkDevice = { setPower: fake.resolves(null), TYPE: 'MP1' };
      const gladysDevice = { external_id: 'broadlink:mac:switch:2' };
      const value = 1;

      await switchDevice.setValue(broadlinkDevice, null, gladysDevice, value);

      assert.calledOnceWithExactly(broadlinkDevice.setPower, 2, true);
    });

    SP4_TYPES.forEach((type) => {
      it(`should power on a ${type} device decrypting the response`, async () => {
        const broadlinkDevice = {
          TYPE: type,
          setPower: fake.resolves(null),
          encode: fake.returns('packet'),
          sendPacket: fake.resolves('encrypted-response'),
          decrypt: fake.returns('decrypted-response'),
          decode: fake.returns({ pwr: true }),
        };
        const gladysDevice = { external_id: 'broadlink:mac:switch:1' };

        await switchDevice.setValue(broadlinkDevice, null, gladysDevice, 1);

        assert.calledOnceWithExactly(broadlinkDevice.encode, 2, { pwr: true });
        assert.calledOnceWithExactly(broadlinkDevice.sendPacket, 'packet');
        assert.calledOnceWithExactly(broadlinkDevice.decrypt, 'encrypted-response');
        assert.calledOnceWithExactly(broadlinkDevice.decode, 'decrypted-response');
        // the broken node-broadlink shortcut is not used
        assert.notCalled(broadlinkDevice.setPower);
      });

      it(`should power off a ${type} device`, async () => {
        const broadlinkDevice = {
          TYPE: type,
          setPower: fake.resolves(null),
          encode: fake.returns('packet'),
          sendPacket: fake.resolves('encrypted-response'),
          decrypt: fake.returns('decrypted-response'),
          decode: fake.returns({ pwr: false }),
        };
        const gladysDevice = { external_id: 'broadlink:mac:switch:1' };

        await switchDevice.setValue(broadlinkDevice, null, gladysDevice, 0);

        assert.calledOnceWithExactly(broadlinkDevice.encode, 2, { pwr: false });
        assert.notCalled(broadlinkDevice.setPower);
      });
    });
  });

  describe('poll', () => {
    it('should do nothing on no feature', async () => {
      const broadlinkDevice = {};
      const gladysDevice = { features: [] };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([]);
    });

    it('should do prepare energy event', async () => {
      const broadlinkDevice = {
        getEnergy: fake.resolves(33),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'externalId',
            category: 'energy-sensor',
          },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'externalId',
          state: 33,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.getEnergy);
    });

    it('should not read switch state when device cannot report it', async () => {
      const broadlinkDevice = {};
      const gladysDevice = {
        features: [
          {
            external_id: 'broadlink:mac:switch:1',
            category: 'switch',
          },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([]);
    });

    it('should prepare switch state event', async () => {
      const broadlinkDevice = {
        checkPower: fake.resolves(true),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'broadlink:mac:switch:1',
            category: 'switch',
          },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'broadlink:mac:switch:1',
          state: 1,
        },
      ]);

      assert.calledOnceWithExactly(broadlinkDevice.checkPower);
    });

    it('should prepare switch off state event', async () => {
      const broadlinkDevice = {
        checkPower: fake.resolves(false),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'broadlink:mac:switch:1',
            category: 'switch',
          },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        {
          device_feature_external_id: 'broadlink:mac:switch:1',
          state: 0,
        },
      ]);
    });

    it('should prepare one switch state event per MP1 channel', async () => {
      const broadlinkDevice = {
        TYPE: 'MP1',
        checkPower: fake.resolves({ s1: true, s2: false, s3: false, s4: true }),
      };
      const gladysDevice = {
        features: [1, 2, 3, 4].map((switchNb) => ({
          external_id: `broadlink:mac:switch:${switchNb}`,
          category: 'switch',
        })),
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        { device_feature_external_id: 'broadlink:mac:switch:1', state: 1 },
        { device_feature_external_id: 'broadlink:mac:switch:2', state: 0 },
        { device_feature_external_id: 'broadlink:mac:switch:3', state: 0 },
        { device_feature_external_id: 'broadlink:mac:switch:4', state: 1 },
      ]);
    });

    it('should prepare both switch and energy events', async () => {
      const broadlinkDevice = {
        checkPower: fake.resolves(true),
        getEnergy: fake.resolves(12),
      };
      const gladysDevice = {
        features: [
          {
            external_id: 'broadlink:mac:switch:1',
            category: 'switch',
          },
          {
            external_id: 'broadlink:mac:energy-sensor',
            category: 'energy-sensor',
          },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        { device_feature_external_id: 'broadlink:mac:switch:1', state: 1 },
        { device_feature_external_id: 'broadlink:mac:energy-sensor', state: 12 },
      ]);
    });
  });
});
