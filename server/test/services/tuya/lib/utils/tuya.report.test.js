const { expect } = require('chai');

const {
  buildCloudReport,
  mergeTuyaReport,
  withTuyaReport,
} = require('../../../../../services/tuya/lib/utils/tuya.report');

describe('Tuya report utils', () => {
  it('should return base report when merge patch is missing', () => {
    const report = mergeTuyaReport(
      {
        schema_version: 2,
        cloud: {
          assembled: {
            specifications: { foo: 'bar' },
          },
          raw: {},
        },
        local: {
          scan: { source: 'udp' },
        },
      },
      null,
    );

    expect(report.cloud.assembled.specifications).to.deep.equal({ foo: 'bar' });
    expect(report.local.scan).to.deep.equal({ source: 'udp' });
  });

  it('should return the original device when withTuyaReport receives no device', () => {
    expect(withTuyaReport(null, { local: { scan: null } })).to.equal(null);
  });

  it('should build cloud report without device list entry when unavailable', () => {
    const report = buildCloudReport({
      deviceId: 'device-id',
      listDeviceEntry: null,
      specResult: null,
      detailsResult: null,
      propsResult: null,
      modelResult: null,
      device: null,
    });

    expect(report.cloud.raw.device_list_entry).to.equal(null);
    expect(report.cloud.raw.device_specification).to.equal(null);
    expect(report.cloud.raw.thing_model).to.equal(null);
  });
});
