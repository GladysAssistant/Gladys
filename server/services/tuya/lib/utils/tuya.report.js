const { API } = require('./tuya.constants');

const REPORT_SCHEMA_VERSION = 2;

const buildRequest = (method, path) => ({
  method,
  path,
});

const normalizeSettledResponse = (request, settledResult) => {
  if (!settledResult) {
    return null;
  }
  if (settledResult.status === 'fulfilled') {
    return {
      request,
      response: settledResult.value || null,
      error: null,
    };
  }
  const error =
    settledResult.reason && settledResult.reason.message ? settledResult.reason.message : settledResult.reason || null;
  return {
    request,
    response: null,
    error,
  };
};

const createBaseReport = (currentReportInput = {}) => {
  const currentReport = currentReportInput || {};
  return {
    schema_version: currentReport.schema_version || REPORT_SCHEMA_VERSION,
    cloud: {
      assembled: {
        specifications:
          currentReport.cloud && currentReport.cloud.assembled
            ? currentReport.cloud.assembled.specifications || null
            : null,
        properties:
          currentReport.cloud && currentReport.cloud.assembled
            ? currentReport.cloud.assembled.properties || null
            : null,
        thing_model:
          currentReport.cloud && currentReport.cloud.assembled
            ? currentReport.cloud.assembled.thing_model || null
            : null,
      },
      raw: {
        device_list_entry:
          currentReport.cloud && currentReport.cloud.raw ? currentReport.cloud.raw.device_list_entry || null : null,
        device_specification:
          currentReport.cloud && currentReport.cloud.raw ? currentReport.cloud.raw.device_specification || null : null,
        device_details:
          currentReport.cloud && currentReport.cloud.raw ? currentReport.cloud.raw.device_details || null : null,
        thing_shadow_properties:
          currentReport.cloud && currentReport.cloud.raw
            ? currentReport.cloud.raw.thing_shadow_properties || null
            : null,
        thing_model:
          currentReport.cloud && currentReport.cloud.raw ? currentReport.cloud.raw.thing_model || null : null,
      },
    },
    local: {
      scan: currentReport.local ? currentReport.local.scan || null : null,
    },
  };
};

const mergeTuyaReport = (currentReport, reportPatch) => {
  const base = createBaseReport(currentReport);
  if (!reportPatch) {
    return base;
  }
  return {
    schema_version: reportPatch.schema_version || base.schema_version,
    cloud: {
      assembled: {
        ...base.cloud.assembled,
        ...(reportPatch.cloud && reportPatch.cloud.assembled ? reportPatch.cloud.assembled : {}),
      },
      raw: {
        ...base.cloud.raw,
        ...(reportPatch.cloud && reportPatch.cloud.raw ? reportPatch.cloud.raw : {}),
      },
    },
    local: {
      ...base.local,
      ...(reportPatch.local || {}),
    },
  };
};

const withTuyaReport = (device, reportPatch) => {
  if (!device) {
    return device;
  }
  return {
    ...device,
    tuya_report: mergeTuyaReport(device.tuya_report, reportPatch),
  };
};

const buildDeviceListEntryReport = (deviceListEntry) => {
  if (!deviceListEntry) {
    return null;
  }
  return {
    request: buildRequest('GET', `${API.PUBLIC_VERSION_1_0}/users/{sourceId}/devices`),
    response_item: deviceListEntry,
  };
};

const buildLocalScanReport = (localInfo) => ({
  local: {
    scan: localInfo
      ? {
          source: 'udp',
          response: localInfo,
        }
      : null,
  },
});

const buildCloudReport = ({ deviceId, listDeviceEntry, specResult, detailsResult, propsResult, modelResult, device }) =>
  mergeTuyaReport(null, {
    schema_version: REPORT_SCHEMA_VERSION,
    cloud: {
      assembled: {
        specifications: device && device.specifications ? device.specifications : null,
        properties: device && device.properties ? device.properties : null,
        thing_model: device && device.thing_model ? device.thing_model : null,
      },
      raw: {
        device_list_entry: buildDeviceListEntryReport(listDeviceEntry),
        device_specification: normalizeSettledResponse(
          buildRequest('GET', `${API.VERSION_1_2}/devices/${deviceId}/specification`),
          specResult,
        ),
        device_details: normalizeSettledResponse(
          buildRequest('GET', `${API.VERSION_1_0}/devices/${deviceId}`),
          detailsResult,
        ),
        thing_shadow_properties: normalizeSettledResponse(
          buildRequest('GET', `${API.VERSION_2_0}/thing/${deviceId}/shadow/properties`),
          propsResult,
        ),
        thing_model: normalizeSettledResponse(
          buildRequest('GET', `${API.VERSION_2_0}/thing/${deviceId}/model`),
          modelResult,
        ),
      },
    },
  });

module.exports = {
  REPORT_SCHEMA_VERSION,
  buildCloudReport,
  buildLocalScanReport,
  mergeTuyaReport,
  withTuyaReport,
};
