import get from 'get-value';
import {
  normalizeBoolean,
  buildParamsMap,
  getParamValue,
  getLocalOverrideValue,
  getProductIdentifier,
  getUnknownDpsKeys,
  getUnknownSpecificationCodes
} from '../commons/deviceHelpers';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';
const GITHUB_SEARCH_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues?q=';
const GITHUB_SEARCH_API_URL = 'https://api.github.com/search/issues?q=';
const GITHUB_SEARCH_CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_GITHUB_CACHE_SIZE = 100;
const MAX_GITHUB_URL_LENGTH = 8000;
const githubIssueCache = new Map();

const maskIp = ip => {
  if (!ip || typeof ip !== 'string') {
    return null;
  }
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(part => part === '' || Number.isNaN(parseInt(part, 10)))) {
    return null;
  }
  return `${parts[0]}.x.x.x`;
};

const sanitizeParams = params => {
  if (!Array.isArray(params)) {
    return [];
  }
  return params.map(param => {
    if (param.name === 'LOCAL_KEY') {
      return { ...param, value: '***' };
    }
    if (param.name === 'IP_ADDRESS' || param.name === 'CLOUD_IP') {
      return { ...param, value: maskIp(param.value) };
    }
    return param;
  });
};

const sanitizeIssueValue = (key, value) => {
  if (key === 'local_key') {
    return '***';
  }
  if ((key === 'ip' || key === 'cloud_ip') && typeof value === 'string') {
    return maskIp(value);
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeIssueValue(null, item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, currentKey) => {
      acc[currentKey] = sanitizeIssueValue(currentKey, value[currentKey]);
      return acc;
    }, {});
  }
  return value;
};

const buildFallbackTuyaReport = device => ({
  schema_version: 2,
  cloud: {
    assembled: {
      specifications: (device && device.specifications) || null,
      properties: (device && device.properties) || null,
      thing_model: (device && device.thing_model) || null
    },
    raw: {
      device_list_entry: null,
      device_specification: null,
      device_details: null,
      thing_shadow_properties: null,
      thing_model: null
    }
  },
  local: {
    scan: null
  }
});

const getSanitizedTuyaReport = device =>
  sanitizeIssueValue(null, device && device.tuya_report ? device.tuya_report : buildFallbackTuyaReport(device));

const getDeviceId = device => {
  if (!device) {
    return null;
  }
  if (device.id) {
    return device.id;
  }
  const paramDeviceId = getParamValue(device, 'DEVICE_ID');
  if (paramDeviceId) {
    return paramDeviceId;
  }
  if (device.external_id && device.external_id.includes(':')) {
    return device.external_id.split(':')[1] || null;
  }
  return null;
};

const compactObject = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  return Object.keys(value).reduce((acc, key) => {
    if (value[key] !== undefined && value[key] !== null) {
      acc[key] = value[key];
    }
    return acc;
  }, {});
};

const isResolvedDeviceType = value => !!value && value !== 'unknown';

const toPrettyJson = value => JSON.stringify(value, null, 2);

const toCodeBlock = (language, value) =>
  `\`\`\`${language}\n${typeof value === 'string' ? value : toPrettyJson(value)}\n\`\`\``;

const slugifyFixturePart = value => {
  if (!value || typeof value !== 'string') {
    return 'tuya-device';
  }
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'tuya-device';
};

const buildSuggestedFixtureDirectory = issuePayload => {
  const modelPart = slugifyFixturePart(get(issuePayload, 'device.model') || get(issuePayload, 'device.name'));
  const productPart = slugifyFixturePart(get(issuePayload, 'device.product_id') || get(issuePayload, 'device.id'));
  if (modelPart === productPart) {
    return modelPart;
  }
  return `${modelPart}-${productPart}`;
};

const buildSuggestedInputDevice = issuePayload => {
  const device = issuePayload && issuePayload.device ? issuePayload.device : {};
  const params = buildParamsMap(device);
  const details = get(issuePayload, 'cloud.raw.device_details.response.result') || {};
  return compactObject({
    id: device.id || details.id || params.DEVICE_ID,
    name: device.name || details.name,
    product_name: details.product_name || device.model,
    model: details.model || device.model,
    product_id: device.product_id || details.product_id,
    product_key: device.product_key || details.product_key || params.PRODUCT_KEY,
    local_key: details.local_key || params.LOCAL_KEY,
    ip: params.IP_ADDRESS || null,
    cloud_ip: params.CLOUD_IP || details.ip,
    protocol_version: device.protocol_version || null,
    local_override: normalizeBoolean(device.local_override),
    online: device.online,
    specifications: get(issuePayload, 'cloud.assembled.specifications') || {},
    properties: get(issuePayload, 'cloud.assembled.properties') || {},
    thing_model: get(issuePayload, 'cloud.assembled.thing_model') || null
  });
};

const buildSuggestedPollDevice = issuePayload =>
  compactObject({
    external_id: get(issuePayload, 'device.external_id') || null,
    device_type: isResolvedDeviceType(get(issuePayload, 'device.device_type'))
      ? get(issuePayload, 'device.device_type')
      : null,
    params: get(issuePayload, 'device.params') || [],
    features: get(issuePayload, 'device.features') || [],
    tuya_mapping: get(issuePayload, 'device.tuya_mapping') || null
  });

const buildSuggestedCloudStatus = issuePayload => {
  const properties = get(issuePayload, 'cloud.assembled.properties.properties') || [];
  return {
    result: properties
      .filter(item => item && item.code !== undefined && item.code !== null && item.value !== undefined)
      .map(item => ({
        code: item.code,
        value: item.value
      }))
  };
};

const escapeJsString = value =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

const buildSuggestedManifest = issuePayload => {
  const name = get(issuePayload, 'device.name') || get(issuePayload, 'device.model') || 'tuya device';
  const hasLocalPoll = !!get(issuePayload, 'local.poll.dps');
  const lines = [
    'module.exports = {',
    `  name: '${escapeJsString(name)}',`,
    '  convertDevice: {',
    "    input: './input-device.json',",
    "    expected: './expected-device.json',",
    '  },',
    '  pollCloud: {',
    "    device: './poll-device.json',",
    "    response: './cloud-status.json',",
    "    expectedEvents: './expected-cloud-events.json',",
    '  },'
  ];
  if (hasLocalPoll) {
    lines.push(
      '  pollLocal: {',
      "    device: './poll-device.json',",
      "    dps: './local-dps.json',",
      "    expectedEvents: './expected-local-events.json',",
      '    expectedCloudRequests: 0,',
      '  },'
    );
  }
  lines.push(
    '  localMapping: {',
    "    device: './poll-device.json',",
    "    expected: './expected-local-mapping.json',",
    '  },',
    '};'
  );
  return lines.join('\n');
};

const buildSupplementalDiagnostics = (device, issuePayload, localPollStatus, localPollError, effectiveLocalPollDps) => {
  const unknownSpecificationCodes = getUnknownSpecificationCodes(device.specifications, device.features, device);
  const unknownLocalDpsKeys = getUnknownDpsKeys(effectiveLocalPollDps, device.features, device);
  const listEntry = get(issuePayload, 'cloud.raw.device_list_entry.response_item') || {};
  const listStatus = Array.isArray(listEntry.status) ? listEntry.status : [];
  const assembledSpecifications = get(issuePayload, 'cloud.assembled.specifications') || {};
  const assembledProperties = get(issuePayload, 'cloud.assembled.properties') || {};
  const assembledThingModel = get(issuePayload, 'cloud.assembled.thing_model') || {};
  const thingServices = Array.isArray(assembledThingModel.services) ? assembledThingModel.services : [];
  const thingModelPropertyCount = thingServices.reduce((acc, service) => {
    const serviceProperties = Array.isArray(service && service.properties) ? service.properties : [];
    return acc + serviceProperties.length;
  }, 0);
  const cloudErrors = compactObject({
    specification: get(issuePayload, 'cloud.raw.device_specification.error') || null,
    details: get(issuePayload, 'cloud.raw.device_details.error') || null,
    shadow_properties: get(issuePayload, 'cloud.raw.thing_shadow_properties.error') || null,
    thing_model: get(issuePayload, 'cloud.raw.thing_model.error') || null
  });
  return compactObject({
    selector: get(issuePayload, 'device.selector') || null,
    service_id: get(issuePayload, 'device.service_id') || null,
    device_type: get(issuePayload, 'device.device_type') || null,
    feature_count: Array.isArray(get(issuePayload, 'device.features'))
      ? get(issuePayload, 'device.features').length
      : 0,
    discovery_inputs: {
      product_id: get(issuePayload, 'device.product_id') || null,
      model: get(issuePayload, 'device.model') || null,
      category_from_specification: assembledSpecifications.category || null,
      category_from_list_entry: listEntry.category || null,
      thing_model_id: assembledThingModel.modelId || null
    },
    cloud_source_counts: {
      specification_functions: Array.isArray(assembledSpecifications.functions)
        ? assembledSpecifications.functions.length
        : 0,
      specification_status: Array.isArray(assembledSpecifications.status) ? assembledSpecifications.status.length : 0,
      list_status: listStatus.length,
      shadow_properties: Array.isArray(assembledProperties.properties) ? assembledProperties.properties.length : 0,
      thing_model_properties: thingModelPropertyCount
    },
    cloud_raw_errors: Object.keys(cloudErrors).length > 0 ? cloudErrors : undefined,
    protocol_version: get(issuePayload, 'device.protocol_version') || null,
    poll_frequency: get(issuePayload, 'device.poll_frequency') || null,
    should_poll: get(issuePayload, 'device.should_poll') || null,
    local_poll_status: localPollStatus || null,
    local_poll_error: localPollError || null,
    unknown_specification_codes: unknownSpecificationCodes.length > 0 ? unknownSpecificationCodes : undefined,
    unknown_local_dps: unknownLocalDpsKeys.length > 0 ? unknownLocalDpsKeys : undefined
  });
};

export const buildIssueTitle = device => {
  const isLocal = normalizeBoolean(getLocalOverrideValue(device));
  const modeLabel = isLocal ? 'local' : 'cloud';
  const productIdentifier = getProductIdentifier(device);
  const modelLabel = device.model || device.product_name || device.name || 'Unknown device';
  return `Tuya (${modeLabel}) [${productIdentifier}]: Add support for ${modelLabel}`;
};

export const buildFollowUpIssueTitle = (baseTitle, latestIssueNumber) => {
  const normalizedBaseTitle = baseTitle || 'Tuya: Add support for unknown device';
  const parsedIssueNumber = Number.parseInt(latestIssueNumber, 10);
  if (Number.isInteger(parsedIssueNumber) && parsedIssueNumber > 0) {
    return `${normalizedBaseTitle} (follow-up of #${parsedIssueNumber})`;
  }
  return `${normalizedBaseTitle} (follow-up)`;
};

const buildGithubSearchQuery = title => `repo:GladysAssistant/Gladys in:title "${title}"`;

export const buildGithubSearchUrl = title =>
  `${GITHUB_SEARCH_BASE_URL}${encodeURIComponent(buildGithubSearchQuery(title))}`;

const buildGithubSearchApiUrl = title => {
  const query = buildGithubSearchQuery(title);
  return `${GITHUB_SEARCH_API_URL}${encodeURIComponent(query)}&sort=created&order=desc&per_page=1`;
};

const setGithubIssueCache = (query, value) => {
  if (githubIssueCache.has(query)) {
    githubIssueCache.delete(query);
  }
  if (githubIssueCache.size >= MAX_GITHUB_CACHE_SIZE) {
    const oldestKey = githubIssueCache.keys().next().value;
    if (oldestKey !== undefined) {
      githubIssueCache.delete(oldestKey);
    }
  }
  githubIssueCache.set(query, value);
};

export const checkGithubIssues = async title => {
  const query = buildGithubSearchQuery(title);
  const cached = githubIssueCache.get(query);
  if (cached && Date.now() - cached.timestamp < GITHUB_SEARCH_CACHE_TTL_MS) {
    return cached.result;
  }

  let response;
  const searchApiUrl = buildGithubSearchApiUrl(title);
  if (typeof AbortController === 'undefined') {
    response = await fetch(searchApiUrl);
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      response = await fetch(searchApiUrl, {
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
  if (!response.ok) {
    throw new Error('Github search failed');
  }
  const data = await response.json();
  const totalCount = data && typeof data.total_count === 'number' ? data.total_count : 0;
  const firstIssue = Array.isArray(data && data.items) && data.items.length > 0 ? data.items[0] : null;
  const latestIssueNumber =
    firstIssue && typeof firstIssue.number === 'number' && firstIssue.number > 0 ? firstIssue.number : null;
  const result = {
    exists: totalCount > 0,
    totalCount,
    latestIssueNumber
  };
  setGithubIssueCache(query, { result, timestamp: Date.now() });
  return result;
};

const buildIssuePayload = (device, localPollStatus, localPollError, localPollValidation, localPollDps) => {
  if (!device) {
    return null;
  }
  const productId = device.product_id || getParamValue(device, 'PRODUCT_ID') || null;
  const productKey = device.product_key || getParamValue(device, 'PRODUCT_KEY') || null;
  const tuyaReport = getSanitizedTuyaReport(device);
  return {
    schema_version: tuyaReport && tuyaReport.schema_version ? tuyaReport.schema_version : 2,
    report_type: 'tuya-unsupported-device',
    device: {
      id: getDeviceId(device),
      name: device.name || null,
      selector: device.selector || null,
      model: device.model || device.product_name || null,
      external_id: device.external_id || null,
      service_id: device.service_id || null,
      product_id: productId,
      product_key: productKey,
      device_type: device.device_type || null,
      online: device.online !== undefined ? device.online : null,
      poll_frequency: device.poll_frequency !== undefined ? device.poll_frequency : null,
      protocol_version: device.protocol_version || null,
      local_override: getLocalOverrideValue(device),
      should_poll: device.should_poll !== undefined ? device.should_poll : null,
      features: Array.isArray(device.features) ? device.features : [],
      params: sanitizeParams(device.params),
      tuya_mapping: device.tuya_mapping || null
    },
    cloud: tuyaReport.cloud,
    local: {
      scan: tuyaReport.local ? tuyaReport.local.scan || null : null,
      poll: {
        status: localPollStatus || null,
        error: localPollError || null,
        protocol: localPollValidation ? localPollValidation.protocol : null,
        dps: localPollDps || null
      }
    }
  };
};

const buildIssueBody = (device, localPollStatus, localPollError, localPollValidation, localPollDps) => {
  const issuePayload = buildIssuePayload(device, localPollStatus, localPollError, localPollValidation, localPollDps);
  if (!issuePayload) {
    return '';
  }

  const fixtureDirectory = buildSuggestedFixtureDirectory(issuePayload);
  const inputDevice = buildSuggestedInputDevice(issuePayload);
  const pollDevice = buildSuggestedPollDevice(issuePayload);
  const cloudStatus = buildSuggestedCloudStatus(issuePayload);
  const localDps = get(issuePayload, 'local.poll.dps') || null;
  const localScan = get(issuePayload, 'local.scan.response') || null;
  const supplementalDiagnostics = buildSupplementalDiagnostics(
    device,
    issuePayload,
    localPollStatus,
    localPollError,
    localDps
  );

  const sections = [
    '## Requester Notes',
    '',
    'Please add a short description of your request below (context, expected behavior, observed behavior).',
    '',
    '',
    '',
    '## Summary',
    '',
    'Unsupported or partially supported Tuya device report.',
    '',
    `- Device name: \`${get(issuePayload, 'device.name') || 'Unknown device'}\``,
    `- External ID: \`${get(issuePayload, 'device.external_id') || 'unknown'}\``,
    `- Product ID: \`${get(issuePayload, 'device.product_id') || 'unknown'}\``,
    `- Product key: \`${get(issuePayload, 'device.product_key') || 'unknown'}\``,
    `- Model: \`${get(issuePayload, 'device.model') || 'unknown'}\``,
    `- Category: \`${get(issuePayload, 'cloud.assembled.specifications.category') || 'unknown'}\``,
    `- Online: \`${String(get(issuePayload, 'device.online'))}\``,
    `- Local override: \`${String(get(issuePayload, 'device.local_override'))}\``,
    `- Local poll status: \`${get(issuePayload, 'local.poll.status') || 'not-run'}\``,
    `- Local poll protocol: \`${get(issuePayload, 'local.poll.protocol') || 'unknown'}\``,
    '',
    '## Implementation Guide',
    '',
    'Implement the Tuya support first, then finalize the tests:',
    '',
    '1. Add or update the Tuya cloud mapping in `server/services/tuya/lib/mappings/cloud/`.',
    '2. Add or update the Tuya local mapping in `server/services/tuya/lib/mappings/local/`.',
    '3. Register or update the device definition in `server/services/tuya/lib/mappings/index.js`.',
    '4. If the new feature needs a new Gladys `category/type`, add it in `server/utils/constants.js`.',
    '5. If the new feature uses a new `category/type` not yet handled by Tuya reading, update `readValues` in `server/services/tuya/lib/device/tuya.deviceMapping.js`.',
    '6. If the feature should be writable from Gladys, also update `writeValues` in `server/services/tuya/lib/device/tuya.deviceMapping.js`.',
    '',
    '## Maintainer Notes',
    '',
    'This issue contains:',
    '- the complete structured Tuya report',
    '- suggested fixture input files for onboarding tests',
    '- raw cloud responses',
    '- local poll DPS when available',
    '',
    'This issue does not contain:',
    '- `expected-device.json`',
    '- `expected-events.json` or `expected-cloud-events.json` / `expected-local-events.json`',
    '- `expected-local-mapping.json`',
    '',
    'These expected files should still be reviewed and created manually.',
    '',
    '`poll-device.json` is only a starting point based on the current support level in Gladys.',
    'After adding or updating mappings, it should be completed with the final supported features and mapping metadata.',
    '',
    '## Data Coverage',
    '',
    '- `GET /v1.0/users/{sourceId}/devices` -> `Device List Entry` below',
    '- `GET /v1.2/iot-03/devices/{deviceId}/specification` -> `input-device.json > specifications`',
    '- `GET /v1.0/iot-03/devices/{deviceId}` -> `input-device.json` top-level metadata',
    '- `GET /v2.0/cloud/thing/{deviceId}/shadow/properties` -> `input-device.json > properties` and `cloud-status.json`',
    '- `GET /v2.0/cloud/thing/{deviceId}/model` -> `input-device.json > thing_model`',
    '- local poll -> `local-dps.json` when available',
    '',
    '## Suggested Fixture Folder',
    '',
    toCodeBlock('text', fixtureDirectory),
    '',
    'Example:',
    '',
    toCodeBlock('text', `server/test/services/tuya/fixtures/devices/${fixtureDirectory}`),
    '',
    '## Suggested File: manifest.js',
    '',
    toCodeBlock('js', buildSuggestedManifest(issuePayload)),
    '',
    '## Suggested File: input-device.json',
    '',
    'Use this as the base input for `convertDevice`.',
    '',
    toCodeBlock('json', inputDevice),
    '',
    '## Suggested File: poll-device.json',
    '',
    'Use this as a base Gladys device for cloud/local poll tests.',
    '',
    'Important:',
    '- this file reflects the support level available when the issue was created',
    '- after implementing support in mappings, update `device_type`, `features`, and `tuya_mapping` to match the final Gladys support',
    '- if the final support changes significantly, prefer rebuilding this file from the resulting converted device',
    '',
    toCodeBlock('json', pollDevice),
    '',
    '## Suggested File: cloud-status.json',
    '',
    'Use this as the cloud poll response fixture.',
    '',
    'Derived from `cloud.assembled.properties`.',
    '',
    toCodeBlock('json', cloudStatus),
    ''
  ];

  if (localDps) {
    sections.push(
      '## Suggested File: local-dps.json',
      '',
      'Use this as the local poll DPS fixture.',
      '',
      toCodeBlock('json', localDps),
      ''
    );
  }

  if (localScan) {
    sections.push(
      '## Suggested File: local-scan.json',
      '',
      'Use this only if a local scan payload exists.',
      '',
      toCodeBlock('json', localScan),
      ''
    );
  }

  sections.push(
    '## Manual Files Guide',
    '',
    'Build the remaining files manually after the Tuya mappings are in place:',
    '',
    '1. Paste `input-device.json` from this issue, then add or update the Tuya mappings in `server/services/tuya/lib/mappings/cloud/`, `server/services/tuya/lib/mappings/local/`, and `server/services/tuya/lib/mappings/index.js`.',
    '2. Create `expected-device.json` from the final Gladys device returned by `convertDevice`. This corresponds to the Tuya device as it should appear in the Discover page once support is implemented.',
    '3. Build or complete `poll-device.json` from the final supported Gladys features. It should contain the final `device_type`, `features`, params, and `tuya_mapping` metadata.',
    '4. Copy `cloud-status.json` from the cloud property values and `local-dps.json` from the local poll DPS payload when available.',
    '5. Create `expected-events.json` if cloud and local polling should emit the same states. If they differ, keep separate `expected-cloud-events.json` and `expected-local-events.json` files instead.',
    '6. Create `expected-local-mapping.json` from the final supported features present in `poll-device.json`, using the resolved DPS returned by the local mapping.',
    ''
  );

  sections.push(
    '## Device List Entry',
    '',
    'Source: `GET /v1.0/users/{sourceId}/devices`.',
    '',
    toCodeBlock('json', get(issuePayload, 'cloud.raw.device_list_entry.response_item')),
    '',
    '## Supplemental Diagnostics',
    '',
    'Additional metadata that does not naturally belong to the suggested fixture files.',
    '',
    toCodeBlock('json', supplementalDiagnostics),
    '',
    'Note:',
    '',
    '- The raw `thing_model.response.result.model` string is intentionally omitted here because it is already represented in a readable object form in `input-device.json > thing_model`.',
    '',
    '## Remaining Files To Create Manually',
    '',
    toCodeBlock(
      'text',
      [
        'mapping file(s) in `server/services/tuya/lib/mappings/cloud/` and/or `server/services/tuya/lib/mappings/local/`',
        '`server/services/tuya/lib/mappings/index.js`',
        '`server/utils/constants.js` when a new Gladys category/type is required',
        '`server/services/tuya/lib/device/tuya.deviceMapping.js` when new read/write handlers are required',
        'poll-device.json (completed with final supported features)',
        'expected-device.json',
        'expected-events.json or expected-cloud-events.json / expected-local-events.json',
        'expected-local-mapping.json'
      ].join('\n')
    ),
    '',
    '## Validation Checklist',
    '',
    '- Confirm the inferred `device_type`',
    '- Create or update the mapping files in `server/services/tuya/lib/mappings/cloud/` and/or `server/services/tuya/lib/mappings/local/`',
    '- Register the mapping in `server/services/tuya/lib/mappings/index.js`',
    '- Update `server/utils/constants.js` if the feature introduces a new Gladys `category/type`',
    '- Update `server/services/tuya/lib/device/tuya.deviceMapping.js` if new `readValues` or `writeValues` handlers are needed',
    '- Rebuild `poll-device.json` so it matches the final supported Gladys features',
    '- Build `expected-device.json` from the final converted Gladys device shown in Discover',
    '- Confirm the expected Gladys features',
    '- Use a shared `expected-events.json` only when cloud and local polling should emit the same states',
    '- Confirm cloud polling behavior',
    '- Confirm local polling behavior',
    '- Confirm local mapping',
    '- Add or update mapping files if needed'
  );

  return sections.join('\n');
};

export const createGithubIssueData = (
  device,
  localPollStatus,
  localPollError,
  localPollValidation,
  localPollDps,
  options = {}
) => {
  const issueTitle = options.title || buildIssueTitle(device);
  const title = encodeURIComponent(issueTitle);
  const body = buildIssueBody(device, localPollStatus, localPollError, localPollValidation, localPollDps);
  const urlWithBody = `${GITHUB_BASE_URL}?title=${title}&body=${encodeURIComponent(body)}`;
  if (urlWithBody.length <= MAX_GITHUB_URL_LENGTH) {
    return { url: urlWithBody, body, truncated: false, title: issueTitle };
  }
  return {
    url: `${GITHUB_BASE_URL}?title=${title}`,
    body,
    truncated: true,
    title: issueTitle
  };
};

export const createEmptyGithubIssueUrl = title => `${GITHUB_BASE_URL}?title=${encodeURIComponent(title)}`;
