const { expect } = require('chai');

const {
  getSetting,
  getGladysDeviceFeatures,
  buildFullPayload,
  transformValueFromMELCloud,
  transformValueFromGladys,
} = require('../../../../../services/melcloud-home/lib/device/air-to-air.device');
const { AC_MODE } = require('../../../../../utils/constants');

const buildUnit = (overrides = {}) => ({
  capabilities: {
    minTempHeat: 8,
    maxTempHeat: 31,
    minTempCoolDry: 16,
    maxTempCoolDry: 31,
    minTempAutomatic: 16,
    maxTempAutomatic: 31,
  },
  settings: [
    { name: 'Power', value: 'True' },
    { name: 'OperationMode', value: 'Cool' },
    { name: 'SetTemperature', value: '21' },
    { name: 'RoomTemperature', value: '23.5' },
    { name: 'SetFanSpeed', value: 'Four' },
    { name: 'VaneVerticalDirection', value: 'Swing' },
    { name: 'VaneHorizontalDirection', value: 'Auto' },
    { name: 'InStandbyMode', value: 'False' },
  ],
  ...overrides,
});

describe('MELCloudHome air-to-air device', () => {
  describe('getSetting', () => {
    it('should return the value or undefined', () => {
      expect(getSetting(buildUnit(), 'Power')).to.equal('True');
      expect(getSetting(buildUnit(), 'Missing')).to.equal(undefined);
      expect(getSetting({}, 'Power')).to.equal(undefined);
    });
  });

  describe('getGladysDeviceFeatures', () => {
    it('should build 4 features with temperature bounds from capabilities', () => {
      const features = getGladysDeviceFeatures('melcloud-home:uuid', buildUnit());
      expect(features).to.have.lengthOf(4);
      const temperature = features.find((f) => f.external_id === 'melcloud-home:uuid:temperature');
      expect(temperature.min).to.equal(8);
      expect(temperature.max).to.equal(31);
      const room = features.find((f) => f.external_id === 'melcloud-home:uuid:room-temperature');
      expect(room.read_only).to.equal(true);
    });

    it('should fall back to default bounds when there are no capabilities', () => {
      const features = getGladysDeviceFeatures('melcloud-home:uuid', { settings: [] });
      const temperature = features.find((f) => f.external_id === 'melcloud-home:uuid:temperature');
      expect(temperature.min).to.equal(10);
      expect(temperature.max).to.equal(31);
    });
  });

  describe('transformValueFromMELCloud', () => {
    it('should transform power on/off', () => {
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:power' }, buildUnit())).to.equal(1);
      expect(
        transformValueFromMELCloud(
          { external_id: 'melcloud-home:uuid:power' },
          buildUnit({ settings: [{ name: 'Power', value: 'False' }] }),
        ),
      ).to.equal(0);
    });

    it('should transform mode', () => {
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:mode' }, buildUnit())).to.equal(
        AC_MODE.COOLING,
      );
    });

    it('should return null for an unknown mode', () => {
      expect(
        transformValueFromMELCloud(
          { external_id: 'melcloud-home:uuid:mode' },
          buildUnit({ settings: [{ name: 'OperationMode', value: 'Weird' }] }),
        ),
      ).to.equal(null);
    });

    it('should transform target and room temperatures', () => {
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:temperature' }, buildUnit())).to.equal(21);
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:room-temperature' }, buildUnit())).to.equal(
        23.5,
      );
    });

    it('should return null for missing, empty or non-numeric temperatures', () => {
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:temperature' }, { settings: [] })).to.equal(
        null,
      );
      expect(
        transformValueFromMELCloud(
          { external_id: 'melcloud-home:uuid:temperature' },
          buildUnit({ settings: [{ name: 'SetTemperature', value: '' }] }),
        ),
      ).to.equal(null);
      expect(
        transformValueFromMELCloud(
          { external_id: 'melcloud-home:uuid:room-temperature' },
          buildUnit({ settings: [{ name: 'RoomTemperature', value: 'abc' }] }),
        ),
      ).to.equal(null);
    });

    it('should return null for an unknown code', () => {
      expect(transformValueFromMELCloud({ external_id: 'melcloud-home:uuid:unknown' }, buildUnit())).to.equal(null);
    });
  });

  describe('buildFullPayload', () => {
    it('should build a full command payload from the current state', () => {
      expect(buildFullPayload(buildUnit())).to.deep.equal({
        power: true,
        operationMode: 'Cool',
        setTemperature: 21,
        setFanSpeed: 'Four',
        vaneVerticalDirection: 'Swing',
        vaneHorizontalDirection: 'Auto',
        temperatureIncrementOverride: null,
        inStandbyMode: false,
      });
    });
  });

  describe('transformValueFromGladys', () => {
    it('should transform power', () => {
      expect(transformValueFromGladys({ external_id: 'melcloud-home:uuid:power' }, 1)).to.deep.equal({ power: true });
      expect(transformValueFromGladys({ external_id: 'melcloud-home:uuid:power' }, 0)).to.deep.equal({ power: false });
    });

    it('should transform mode', () => {
      expect(transformValueFromGladys({ external_id: 'melcloud-home:uuid:mode' }, AC_MODE.HEATING)).to.deep.equal({
        operationMode: 'Heat',
      });
    });

    it('should transform temperature', () => {
      expect(transformValueFromGladys({ external_id: 'melcloud-home:uuid:temperature' }, 22)).to.deep.equal({
        setTemperature: 22,
      });
    });

    it('should return null for a non-writable code', () => {
      expect(transformValueFromGladys({ external_id: 'melcloud-home:uuid:room-temperature' }, 22)).to.equal(null);
    });
  });
});
