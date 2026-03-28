const { expect } = require('chai');

const {
  buildCloudReport,
  mergeTuyaReport,
  withTuyaReport,
} = require('../../../../../services/tuya/lib/utils/tuya.report');

describe('Tuya report utils', () => {
  it('should return base report when merge patch is missing', () => {
    const existingReport = {
      cloud: {
        assembled: {
          specifications: { from: 'current' },
        },
      },
      local: {
        scan: { ip: '1.1.1.1' },
      },
    };

    const merged = mergeTuyaReport(existingReport, null);

    expect(merged.schema_version).to.equal(2);
    expect(merged.cloud.assembled.specifications).to.deep.equal({ from: 'current' });
    expect(merged.local.scan).to.deep.equal({ ip: '1.1.1.1' });
  });

  it('should return same device when withTuyaReport is called without device', () => {
    expect(withTuyaReport(null, { local: { scan: { ip: '2.2.2.2' } } })).to.equal(null);
  });

  it('should keep null raw report entries when cloud data is missing', () => {
    const report = buildCloudReport({
      deviceId: 'device-1',
      listDeviceEntry: null,
      specResult: null,
      detailsResult: undefined,
      propsResult: null,
      modelResult: undefined,
      device: {},
    });

    expect(report.cloud.raw.device_list_entry).to.equal(null);
    expect(report.cloud.raw.device_specification).to.equal(null);
    expect(report.cloud.raw.device_details).to.equal(null);
    expect(report.cloud.raw.thing_shadow_properties).to.equal(null);
    expect(report.cloud.raw.thing_model).to.equal(null);
  });
});
