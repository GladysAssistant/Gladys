const { expect } = require('chai');

const {
  hasUsefulFeature,
  hasUsefulDefinition,
  getSupport,
  getZigbee2mqttInfo,
} = require('../../../../services/zigbee2mqtt/utils/support');

const occupancy = {
  type: 'binary',
  name: 'occupancy',
  property: 'occupancy',
  access: 1,
  value_on: true,
  value_off: false,
};
const linkquality = { type: 'numeric', name: 'linkquality', property: 'linkquality', access: 1 };

describe('zigbee2mqtt support', () => {
  describe('hasUsefulFeature', () => {
    it('should tell a feature to control or read as useful', () => {
      expect(hasUsefulFeature([{ category: 'signal' }, { category: 'light' }])).to.equal(true);
    });

    it('should not tell battery, signal and device temperature as useful', () => {
      const features = [
        { category: 'battery' },
        { category: 'battery-low' },
        { category: 'signal' },
        { category: 'device-temperature-sensor' },
      ];
      expect(hasUsefulFeature(features)).to.equal(false);
    });
  });

  describe('hasUsefulDefinition', () => {
    it('should tell a definition whose exposes give a useful feature', () => {
      expect(hasUsefulDefinition('0x01', { exposes: [occupancy, linkquality] })).to.equal(true);
    });

    it('should not tell a definition with only the link quality', () => {
      expect(hasUsefulDefinition('0x01', { exposes: [linkquality] })).to.equal(false);
    });

    it('should not tell a missing definition', () => {
      expect(hasUsefulDefinition('0x01', undefined)).to.equal(false);
    });
  });

  describe('getSupport', () => {
    const useful = [{ category: 'motion-sensor' }];

    it('should tell a device Zigbee2mqtt supports as native', () => {
      expect(getSupport({ supported: true, definition: {} }, [])).to.equal('native');
    });

    it('should not list the coordinator, supported without definition', () => {
      expect(getSupport({ supported: true }, [])).to.equal(null);
    });

    it('should not list a device not supported whose interview runs (Zigbee2mqtt 2)', () => {
      expect(getSupport({ supported: false, interview_state: 'IN_PROGRESS' }, [])).to.equal(null);
      expect(getSupport({ supported: false, interview_state: 'PENDING' }, [])).to.equal(null);
    });

    it('should not list a device not supported whose interview runs (Zigbee2mqtt 1)', () => {
      expect(getSupport({ supported: false, interviewing: true, interview_completed: false }, [])).to.equal(null);
    });

    it('should tell a failed interview (Zigbee2mqtt 2)', () => {
      expect(getSupport({ supported: false, interview_state: 'FAILED', definition: {} }, useful)).to.equal(
        'interview_failed',
      );
    });

    it('should tell a failed interview (Zigbee2mqtt 1)', () => {
      expect(getSupport({ supported: false, interviewing: false, interview_completed: false }, [])).to.equal(
        'interview_failed',
      );
    });

    it('should tell a generated definition with a useful feature as generic', () => {
      expect(getSupport({ supported: false, interview_state: 'SUCCESSFUL', definition: {} }, useful)).to.equal(
        'generic',
      );
    });

    it('should tell a generated definition without a useful feature as unsupported', () => {
      const device = { supported: false, interview_state: 'SUCCESSFUL', definition: {} };
      expect(getSupport(device, [{ category: 'signal' }])).to.equal('unsupported');
    });

    it('should tell a device without definition after its interview as unsupported (Zigbee2mqtt 1)', () => {
      const device = { supported: false, interview_completed: true, interviewing: false, definition: null };
      expect(getSupport(device, [])).to.equal('unsupported');
    });
  });

  describe('getZigbee2mqttInfo', () => {
    it('should keep what a report needs', () => {
      const info = getZigbee2mqttInfo({
        friendly_name: 'kitchen',
        model_id: 'TS0505B',
        manufacturer: '_TZ3210_abcd',
        power_source: 'Mains (single phase)',
        interview_state: 'SUCCESSFUL',
        definition: {
          model: 'TS0505B',
          vendor: '_TZ3210_abcd',
          description: 'Automatically generated definition',
          exposes: [occupancy],
          options: [],
        },
        endpoints: {
          1: { bindings: [], clusters: { input: ['genOnOff'], output: ['genOta'] }, configured_reportings: [] },
          242: {},
        },
      });
      expect(info).to.deep.equal({
        model_id: 'TS0505B',
        manufacturer: '_TZ3210_abcd',
        power_source: 'Mains (single phase)',
        interview_state: 'SUCCESSFUL',
        definition: {
          model: 'TS0505B',
          vendor: '_TZ3210_abcd',
          description: 'Automatically generated definition',
          exposes: [occupancy],
        },
        endpoints: {
          1: { clusters: { input: ['genOnOff'], output: ['genOta'] } },
          242: { clusters: { input: [], output: [] } },
        },
      });
    });

    it('should tell what is missing as null', () => {
      expect(getZigbee2mqttInfo({ definition: { model: 'x' } })).to.deep.equal({
        model_id: null,
        manufacturer: null,
        power_source: null,
        interview_state: null,
        definition: { model: 'x', vendor: undefined, description: undefined, exposes: [] },
        endpoints: {},
      });
      expect(getZigbee2mqttInfo({}).definition).to.equal(null);
    });
  });
});
