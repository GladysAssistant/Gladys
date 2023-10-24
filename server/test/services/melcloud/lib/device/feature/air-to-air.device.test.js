const { expect } = require('chai');
const {
  getGladysDeviceFeatures,
  transfromValueFromMELCloud,
  transfromValueFromGladys,
} = require('../../../../../../services/melcloud/lib/device/air-to-air.device');
const { AC_MODE } = require('../../../../../../utils/constants');

describe('MELCloud Air to Air device', () => {
  it('should return device features', () => {
    const result = getGladysDeviceFeatures('melcloud:123456789:1', { MinTemperature: 1, MaxTemperature: 100 });
    expect(result).to.deep.eq([
      {
        category: 'air-conditioning',
        external_id: 'melcloud:123456789:1:power',
        has_feedback: true,
        max: 1,
        min: 0,
        name: 'Power',
        read_only: false,
        selector: 'melcloud:123456789:1:power',
        type: 'binary',
      },
      {
        category: 'air-conditioning',
        external_id: 'melcloud:123456789:1:mode',
        has_feedback: true,
        max: 1,
        min: 0,
        name: 'Mode',
        read_only: false,
        selector: 'melcloud:123456789:1:mode',
        type: 'mode',
      },
      {
        category: 'air-conditioning',
        external_id: 'melcloud:123456789:1:temperature',
        has_feedback: true,
        max: 100,
        min: 1,
        name: 'Temperature',
        read_only: false,
        selector: 'melcloud:123456789:1:temperature',
        type: 'target-temperature',
      },
    ]);
  });

  describe('should transform value from MELCloud', () => {
    it('when the power is true', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:power',
        },
        {
          Power: true,
        },
      );
      expect(result).to.eq(1);
    });
    it('when the power is false', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:power',
        },
        {
          Power: false,
        },
      );
      expect(result).to.eq(0);
    });

    it('when the mode is heating', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:mode',
        },
        {
          OperationMode: 1,
        },
      );
      expect(result).to.eq(AC_MODE.HEATING);
    });
    it('when the mode is drying', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:mode',
        },
        {
          OperationMode: 2,
        },
      );
      expect(result).to.eq(AC_MODE.DRYING);
    });
    it('when the mode is cooling', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:mode',
        },
        {
          OperationMode: 3,
        },
      );
      expect(result).to.eq(AC_MODE.COOLING);
    });
    it('when the mode is fan', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:mode',
        },
        {
          OperationMode: 7,
        },
      );
      expect(result).to.eq(AC_MODE.FAN);
    });
    it('when the mode is auto', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:mode',
        },
        {
          OperationMode: 8,
        },
      );
      expect(result).to.eq(AC_MODE.AUTO);
    });
    it('when the temperature is set to 27°', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:temperature',
        },
        {
          SetTemperature: 27,
        },
      );
      expect(result).to.eq(27);
    });
    it('when code is unknown', () => {
      const result = transfromValueFromMELCloud(
        {
          external_id: 'melcloud:123456789:unknown',
        },
        {
          SetTemperature: 27,
        },
      );
      expect(result).to.eq(null);
    });
  });

  describe('should transform value from Gladys', () => {
    it('when the power is true', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:power',
        },
        1,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 1,
        Power: true,
      });
    });
    it('when the power is false', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:power',
        },
        0,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 1,
        Power: false,
      });
    });

    it('when the mode is heating', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:mode',
        },
        AC_MODE.HEATING,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 6,
        OperationMode: 1,
      });
    });
    it('when the mode is drying', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:mode',
        },
        AC_MODE.DRYING,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 6,
        OperationMode: 2,
      });
    });
    it('when the mode is cooling', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:mode',
        },
        AC_MODE.COOLING,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 6,
        OperationMode: 3,
      });
    });
    it('when the mode is fan', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:mode',
        },
        AC_MODE.FAN,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 6,
        OperationMode: 7,
      });
    });
    it('when the mode is auto', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:mode',
        },
        AC_MODE.AUTO,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 6,
        OperationMode: 8,
      });
    });
    it('when the temperature is set to 27°', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:temperature',
        },
        27,
      );
      expect(result).to.deep.eq({
        EffectiveFlags: 4,
        SetTemperature: 27,
      });
    });
    it('when code is unknown', () => {
      const result = transfromValueFromGladys(
        {
          external_id: 'melcloud:123456789:unknown',
        },
        1,
      );
      expect(result).to.eq(null);
    });
  });
});
