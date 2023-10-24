const { expect } = require('chai');

const { convertDevice } = require('../../../../../../services/melcloud/lib/device/melcloud.convertDevice');

describe('MELCloud convert device', () => {
  it('should return converted device air to air', () => {
    const result = convertDevice({
      DeviceID: '192919',
      DeviceName: 'AirCooler',
      Device: {
        Units: [
          {
            Model: 'MSZ-AP25VG',
          },
        ],
        DeviceType: 0,
      },
      BuildingID: '123456789',
      MinTemperature: 1,
      MaxTemperature: 100,
    });
    expect(result).to.deep.eq({
      external_id: 'melcloud:192919',
      features: [
        {
          category: 'air-conditioning',
          external_id: 'melcloud:192919:power',
          has_feedback: true,
          max: 1,
          min: 0,
          name: 'Power',
          read_only: false,
          selector: 'melcloud:192919:power',
          type: 'binary',
        },
        {
          category: 'air-conditioning',
          external_id: 'melcloud:192919:mode',
          has_feedback: true,
          max: 1,
          min: 0,
          name: 'Mode',
          read_only: false,
          selector: 'melcloud:192919:mode',
          type: 'mode',
        },
        {
          category: 'air-conditioning',
          external_id: 'melcloud:192919:temperature',
          has_feedback: true,
          max: 100,
          min: 1,
          name: 'Temperature',
          read_only: false,
          selector: 'melcloud:192919:temperature',
          type: 'target-temperature',
        },
      ],
      model: 'MSZ-AP25VG',
      name: 'AirCooler',
      params: [
        {
          name: 'buildingID',
          value: '123456789',
        },
      ],
      poll_frequency: 10000,
      selector: 'melcloud:192919',
      should_poll: true,
    });
  });

  it('should return converted device air to water', () => {
    const result = convertDevice({
      DeviceID: '192919',
      DeviceName: 'AirToWater',
      Device: {
        Units: [
          {
            Model: 'MSZ-AP25VG',
          },
        ],
        DeviceType: 1,
      },
      BuildingID: '123456789',
      MinTemperature: 1,
      MaxTemperature: 100,
    });
    expect(result).to.deep.eq({
      external_id: 'melcloud:192919',
      features: [],
      model: 'MSZ-AP25VG',
      name: 'AirToWater',
      params: [
        {
          name: 'buildingID',
          value: '123456789',
        },
      ],
      poll_frequency: 10000,
      selector: 'melcloud:192919',
      should_poll: true,
    });
  });

  it('should return converted device energy recovery ventilation', () => {
    const result = convertDevice({
      DeviceID: '192919',
      DeviceName: 'energy recovery ventilation',
      Device: {
        Units: [
          {
            Model: 'MSZ-AP25VG',
          },
        ],
        DeviceType: 3,
      },
      BuildingID: '123456789',
    });
    expect(result).to.deep.eq({
      external_id: 'melcloud:192919',
      features: [],
      model: 'MSZ-AP25VG',
      name: 'energy recovery ventilation',
      params: [
        {
          name: 'buildingID',
          value: '123456789',
        },
      ],
      poll_frequency: 10000,
      selector: 'melcloud:192919',
      should_poll: true,
    });
  });
});
