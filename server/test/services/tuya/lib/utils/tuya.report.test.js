/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');

const {
  buildCloudReport,
  buildLocalScanReport,
  mergeTuyaReport,
  withTuyaReport,
  REPORT_SCHEMA_VERSION,
} = require('../../../../../services/tuya/lib/utils/tuya.report');

describe('Tuya report utils', () => {
  describe('mergeTuyaReport', () => {
    it('should return the base report when reportPatch is null', () => {
      const merged = mergeTuyaReport(null, null);
      expect(merged.schema_version).to.equal(REPORT_SCHEMA_VERSION);
      expect(merged.cloud.assembled).to.deep.equal({
        specifications: null,
        properties: null,
        thing_model: null,
      });
      expect(merged.local).to.deep.equal({ scan: null });
    });

    it('should return the base report when reportPatch is undefined', () => {
      const current = {
        schema_version: REPORT_SCHEMA_VERSION,
        cloud: { assembled: { specifications: ['s1'] } },
        local: { scan: { source: 'udp' } },
      };
      const merged = mergeTuyaReport(current, undefined);
      expect(merged.cloud.assembled.specifications).to.deep.equal(['s1']);
      expect(merged.local.scan).to.deep.equal({ source: 'udp' });
    });

    it('should merge the patch into the base report', () => {
      const merged = mergeTuyaReport(null, {
        cloud: { assembled: { specifications: ['s1'] }, raw: { device_details: { id: 'x' } } },
        local: { scan: { source: 'udp' } },
      });
      expect(merged.cloud.assembled.specifications).to.deep.equal(['s1']);
      expect(merged.cloud.raw.device_details).to.deep.equal({ id: 'x' });
      expect(merged.local.scan).to.deep.equal({ source: 'udp' });
    });

    it('should fall back to null for empty currentReport.cloud.assembled and cloud.raw fields', () => {
      const current = {
        cloud: {
          assembled: { specifications: null, properties: null, thing_model: null },
          raw: {
            device_list_entry: null,
            device_specification: null,
            device_details: null,
            thing_shadow_properties: null,
            thing_model: null,
          },
        },
      };
      const merged = mergeTuyaReport(current, null);
      expect(merged.cloud.assembled).to.deep.equal({
        specifications: null,
        properties: null,
        thing_model: null,
      });
      expect(merged.cloud.raw).to.deep.equal({
        device_list_entry: null,
        device_specification: null,
        device_details: null,
        thing_shadow_properties: null,
        thing_model: null,
      });
    });

    it('should carry forward all currentReport cloud.assembled and cloud.raw fields', () => {
      const current = {
        schema_version: REPORT_SCHEMA_VERSION,
        cloud: {
          assembled: {
            specifications: ['s1'],
            properties: { p: 1 },
            thing_model: { m: 1 },
          },
          raw: {
            device_list_entry: { entry: 1 },
            device_specification: { spec: 1 },
            device_details: { details: 1 },
            thing_shadow_properties: { props: 1 },
            thing_model: { tm: 1 },
          },
        },
        local: { scan: { source: 'udp' } },
      };
      const merged = mergeTuyaReport(current, null);
      expect(merged.cloud.assembled).to.deep.equal({
        specifications: ['s1'],
        properties: { p: 1 },
        thing_model: { m: 1 },
      });
      expect(merged.cloud.raw).to.deep.equal({
        device_list_entry: { entry: 1 },
        device_specification: { spec: 1 },
        device_details: { details: 1 },
        thing_shadow_properties: { props: 1 },
        thing_model: { tm: 1 },
      });
    });
  });

  describe('withTuyaReport', () => {
    it('should return device unchanged when device is null', () => {
      expect(withTuyaReport(null, { local: { scan: {} } })).to.equal(null);
    });

    it('should return device unchanged when device is undefined', () => {
      expect(withTuyaReport(undefined, { local: { scan: {} } })).to.equal(undefined);
    });

    it('should attach a merged tuya_report to the device', () => {
      const device = { external_id: 'tuya:abc' };
      const updated = withTuyaReport(device, { local: { scan: { source: 'udp' } } });
      expect(updated.external_id).to.equal('tuya:abc');
      expect(updated.tuya_report.local.scan).to.deep.equal({ source: 'udp' });
    });
  });

  describe('buildCloudReport', () => {
    it('should produce a null device_list_entry when listDeviceEntry is null', () => {
      const report = buildCloudReport({
        deviceId: 'abc',
        listDeviceEntry: null,
      });
      expect(report.cloud.raw.device_list_entry).to.equal(null);
    });

    it('should produce null normalized entries when settled results are undefined', () => {
      const report = buildCloudReport({
        deviceId: 'abc',
        listDeviceEntry: null,
        specResult: undefined,
        detailsResult: undefined,
        propsResult: undefined,
        modelResult: undefined,
      });
      expect(report.cloud.raw.device_specification).to.equal(null);
      expect(report.cloud.raw.device_details).to.equal(null);
      expect(report.cloud.raw.thing_shadow_properties).to.equal(null);
      expect(report.cloud.raw.thing_model).to.equal(null);
    });

    it('should normalize a rejected settled result with a null reason', () => {
      const report = buildCloudReport({
        deviceId: 'abc',
        listDeviceEntry: null,
        specResult: { status: 'rejected', reason: null },
        detailsResult: undefined,
        propsResult: undefined,
        modelResult: undefined,
        device: null,
      });
      expect(report.cloud.raw.device_specification.request.method).to.equal('GET');
      expect(report.cloud.raw.device_specification.response).to.equal(null);
      expect(report.cloud.raw.device_specification.error).to.equal(null);
    });

    it('should normalize fulfilled and rejected settled results', () => {
      const report = buildCloudReport({
        deviceId: 'abc',
        listDeviceEntry: { id: 'abc' },
        specResult: { status: 'fulfilled', value: { spec: 1 } },
        detailsResult: { status: 'rejected', reason: new Error('boom') },
        propsResult: { status: 'rejected', reason: 'plain-string' },
        modelResult: { status: 'fulfilled', value: null },
        device: { specifications: ['s'], properties: ['p'], thing_model: { schema: [] } },
      });
      expect(report.cloud.raw.device_list_entry).to.deep.equal({
        request: { method: 'GET', path: '/v1.0/users/{sourceId}/devices' },
        response_item: { id: 'abc' },
      });
      expect(report.cloud.raw.device_specification.response).to.deep.equal({ spec: 1 });
      expect(report.cloud.raw.device_specification.error).to.equal(null);
      expect(report.cloud.raw.device_details.response).to.equal(null);
      expect(report.cloud.raw.device_details.error).to.equal('boom');
      expect(report.cloud.raw.thing_shadow_properties.error).to.equal('plain-string');
      expect(report.cloud.raw.thing_model.response).to.equal(null);
      expect(report.cloud.assembled.specifications).to.deep.equal(['s']);
    });
  });

  describe('buildLocalScanReport', () => {
    it('should return null scan when localInfo is falsy', () => {
      expect(buildLocalScanReport(null).local.scan).to.equal(null);
      expect(buildLocalScanReport(undefined).local.scan).to.equal(null);
    });

    it('should wrap localInfo into a UDP scan entry', () => {
      const report = buildLocalScanReport({ ip: '1.1.1.1', version: '3.3' });
      expect(report.local.scan).to.deep.equal({
        source: 'udp',
        response: { ip: '1.1.1.1', version: '3.3' },
      });
    });
  });
});
