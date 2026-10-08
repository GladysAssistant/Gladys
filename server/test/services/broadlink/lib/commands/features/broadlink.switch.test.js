const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const switchDevice = require('../../../../../../services/broadlink/lib/commands/features/broadlink.switch');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../utils/constants');

// node-broadlink classes of the SP4 family, by device TYPE
const SP4_CLASSES = { SP4: 'Sp4', SP4B: 'Sp4b' };

/**
 * @description Builds a real node-broadlink device whose requests are answered as a device does
 * (0x38 bytes header + encrypted payload).
 * @param {string} className - Name of the node-broadlink class.
 * @param {Function} buildAnswer - Builds the clear answer payload from the device.
 * @returns {object} The node-broadlink device, with a fake `sendPacket`.
 * @example
 * buildRealDevice('Sp4', (device) => device.encode(2, { pwr: true }));
 */
const buildRealDevice = (className, buildAnswer) => {
  const broadlinkDevice = new switchDevice.deviceClasses[className](
    { address: '127.0.0.1', port: 80 },
    [1, 2, 3, 4, 5, 6],
    0x7579,
  );
  broadlinkDevice.socket.close();
  const answer = buildAnswer(broadlinkDevice);
  const padding = Buffer.alloc((16 - (answer.length % 16)) % 16);
  const response = Buffer.concat([Buffer.alloc(0x38), broadlinkDevice.encrypt(Buffer.concat([answer, padding]))]);
  broadlinkDevice.sendPacket = fake.resolves(response);
  return broadlinkDevice;
};

/**
 * @description Builds the clear answer of a SP3 device to a state request.
 * @param {number} state - Power (bit 0x01) and nightlight (bit 0x02) state.
 * @returns {Buffer} The answer payload.
 * @example
 * buildSp3Answer(0x01);
 */
const buildSp3Answer = (state) => {
  const answer = Buffer.alloc(16);
  answer[0x4] = state;
  return answer;
};

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

    Object.entries(SP4_CLASSES).forEach(([type, className]) => {
      // node-broadlink Sp4.setState decodes the encrypted answer, and throws "Unexpected end of JSON input"
      it(`should power on a ${type} device and decode its encrypted answer`, async () => {
        const broadlinkDevice = buildRealDevice(className, (device) => device.encode(2, { pwr: true }));
        const gladysDevice = { external_id: 'broadlink:mac:switch:1' };

        await switchDevice.setValue(broadlinkDevice, null, gladysDevice, 1);

        assert.calledOnce(broadlinkDevice.sendPacket);
        const [packet] = broadlinkDevice.sendPacket.firstCall.args;
        expect(broadlinkDevice.decode(packet)).to.include({ pwr: true });
      });

      it(`should power off a ${type} device and decode its encrypted answer`, async () => {
        const broadlinkDevice = buildRealDevice(className, (device) => device.encode(2, { pwr: false }));
        const gladysDevice = { external_id: 'broadlink:mac:switch:1' };

        await switchDevice.setValue(broadlinkDevice, null, gladysDevice, 0);

        assert.calledOnce(broadlinkDevice.sendPacket);
        const [packet] = broadlinkDevice.sendPacket.firstCall.args;
        expect(broadlinkDevice.decode(packet)).to.include({ pwr: false });
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

    it('should not prepare switch state event when state did not change', async () => {
      const broadlinkDevice = {
        TYPE: 'MP1',
        checkPower: fake.resolves({ s1: true, s2: false, s3: false, s4: true }),
      };
      const gladysDevice = {
        features: [
          { external_id: 'broadlink:mac:switch:1', category: 'switch', last_value: 1 },
          { external_id: 'broadlink:mac:switch:2', category: 'switch', last_value: 1 },
          { external_id: 'broadlink:mac:switch:3', category: 'switch', last_value: 0 },
          { external_id: 'broadlink:mac:switch:4', category: 'switch', last_value: null },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([
        { device_feature_external_id: 'broadlink:mac:switch:2', state: 0 },
        { device_feature_external_id: 'broadlink:mac:switch:4', state: 1 },
      ]);
    });

    it('should still prepare energy event when switch state cannot be read', async () => {
      const broadlinkDevice = {
        checkPower: fake.rejects(new Error('switch error')),
        getEnergy: fake.resolves(12),
      };
      const gladysDevice = {
        external_id: 'broadlink:mac',
        features: [
          { external_id: 'broadlink:mac:switch:1', category: 'switch' },
          { external_id: 'broadlink:mac:energy-sensor', category: 'energy-sensor' },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([{ device_feature_external_id: 'broadlink:mac:energy-sensor', state: 12 }]);
    });

    it('should still prepare switch state event when energy cannot be read', async () => {
      const broadlinkDevice = {
        checkPower: fake.resolves(true),
        getEnergy: fake.rejects(new Error('energy error')),
      };
      const gladysDevice = {
        external_id: 'broadlink:mac',
        features: [
          { external_id: 'broadlink:mac:switch:1', category: 'switch' },
          { external_id: 'broadlink:mac:energy-sensor', category: 'energy-sensor' },
        ],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([{ device_feature_external_id: 'broadlink:mac:switch:1', state: 1 }]);
    });

    // node-broadlink Sp3.checkPower reads the nightlight bit (0x02) instead of the power bit (0x01)
    it('should read SP3 power on while nightlight is off', async () => {
      const broadlinkDevice = buildRealDevice('Sp3', () => buildSp3Answer(0x01));
      const gladysDevice = {
        features: [{ external_id: 'broadlink:mac:switch:1', category: 'switch' }],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([{ device_feature_external_id: 'broadlink:mac:switch:1', state: 1 }]);
      assert.calledOnce(broadlinkDevice.sendPacket);
      const [packet] = broadlinkDevice.sendPacket.firstCall.args;
      expect(packet[0]).to.eq(1);
    });

    it('should read SP3 power off while nightlight is on', async () => {
      const broadlinkDevice = buildRealDevice('Sp3', () => buildSp3Answer(0x02));
      const gladysDevice = {
        features: [{ external_id: 'broadlink:mac:switch:1', category: 'switch' }],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([{ device_feature_external_id: 'broadlink:mac:switch:1', state: 0 }]);
    });

    it('should read SP4 power state from its encrypted answer', async () => {
      const broadlinkDevice = buildRealDevice('Sp4', (device) => device.encode(1, { pwr: true, ntlight: false }));
      const gladysDevice = {
        features: [{ external_id: 'broadlink:mac:switch:1', category: 'switch' }],
      };

      const messages = await switchDevice.poll(broadlinkDevice, gladysDevice);

      expect(messages).to.deep.eq([{ device_feature_external_id: 'broadlink:mac:switch:1', state: 1 }]);
    });
  });
});
