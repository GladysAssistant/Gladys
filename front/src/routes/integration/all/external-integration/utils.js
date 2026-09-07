// Get a localized text from a manifest multi-language object ({ en: '...', fr: '...' }).
// Falls back to English, then to the first available language.
export const getLocalizedText = (value, language) => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value[language]) {
    return value[language];
  }
  if (value.en) {
    return value.en;
  }
  const firstLanguage = Object.keys(value)[0];
  return firstLanguage ? value[firstLanguage] : '';
};

// Badge color for each external integration status
export const EXTERNAL_INTEGRATION_STATUS_BADGES = {
  UNKNOWN: 'badge-secondary',
  ENABLED: 'badge-info',
  DISABLED: 'badge-secondary',
  LOADING: 'badge-info',
  RUNNING: 'badge-success',
  DEGRADED: 'badge-warning',
  STOPPED: 'badge-secondary',
  ERROR: 'badge-danger'
};

// Display order of the statuses in the "Installed" view summary: the nominal
// states first, then the ones asking for attention, then the inactive ones.
// A fixed order keeps the strip from reshuffling on every status change.
export const EXTERNAL_INTEGRATION_STATUS_ORDER = [
  'RUNNING',
  'ENABLED',
  'LOADING',
  'DEGRADED',
  'ERROR',
  'STOPPED',
  'DISABLED',
  'UNKNOWN'
];

// Statuses that need no badge in the integration catalog: they are the
// expected state of an installed integration, and repeating them on every
// card only pushes the tags the user actually scans for (Local, Cloud,
// Community) onto a second line. The status stays permanently displayed on
// the integration page itself, where it is the information being looked for.
// The "Installed" view is the exception: there the status *is* the reason
// the user opened the view, so every card wears its badge (see the
// `alwaysShowStatus` prop of the catalog cards).
const EXTERNAL_INTEGRATION_NOMINAL_STATUSES = ['RUNNING', 'ENABLED'];

// True when a status is worth a badge in the catalog: anything that is not
// the nominal state (ERROR, DEGRADED, STOPPED, DISABLED, LOADING, UNKNOWN)
// is what the user wants to spot at a glance among dozens of cards.
export const isNoteworthyExternalIntegrationStatus = status =>
  Boolean(status) && !EXTERNAL_INTEGRATION_NOMINAL_STATUSES.includes(status);

export const getGithubRepoUrl = storeSlug => (storeSlug ? `https://github.com/${storeSlug}` : null);

// Changelog of an external integration version: the releases page of its
// repository, filtered on the version so the release notes of that exact
// version are displayed. Filtered rather than linked straight to
// `/releases/tag/<version>`, because the tag name is the author's choice
// (`1.2.0` and `v1.2.0` are both common, Gladys itself uses the second) and a
// guessed tag that does not exist is a plain 404. Both forms are queried:
// GitHub matches the search against whole tokens of the title / body / tag,
// so a bare `1.2.0` never matches a `v1.2.0` tag (it returns "No releases
// found") — `1.2.0 OR v1.2.0` matches whichever form the author tagged with.
// Without a version (or with a repository that publishes no release) it
// degrades to the releases page, and a dev install has no repository at all:
// null, the version is then displayed as plain text.
export const getChangelogUrl = (storeSlug, version) => {
  const repoUrl = getGithubRepoUrl(storeSlug);
  if (!repoUrl) {
    return null;
  }
  if (!version) {
    return `${repoUrl}/releases`;
  }
  return `${repoUrl}/releases?q=${encodeURIComponent(`${version} OR v${version}`)}&expanded=true`;
};

// Domain of an https URL, displayed next to section links (third-party
// non-moderated content: the user sees where they click).
export const getUrlDomain = url => (url || '').split('/')[2] || '';

// Assigned host ports of the manifest-named declared ports, from the
// integration detail (containers[].ports[]). Feeds the {{port:<name>}}
// placeholder resolution below.
export const getAssignedPortsByName = integration => {
  // null prototype: the allowed port name pattern ([a-z0-9_]) accepts
  // `constructor` and `__proto__`, which on a plain object would either
  // read an inherited value or silently fail to store one
  const portsByName = Object.create(null);
  ((integration && integration.containers) || []).forEach(container => {
    (container.ports || []).forEach(port => {
      if (port.name && port.host_port !== null && port.host_port !== undefined) {
        portsByName[port.name] = port.host_port;
      }
    });
  });
  return portsByName;
};

// Resolve the declarative placeholders of the manifest section texts:
// {{gladys_host}} -> the hostname the browser reaches Gladys by (the
// server cannot know it reliably — multiple interfaces, reverse proxy,
// VPN — but the browser does, by construction), {{port:<name>}} -> the
// host port assigned to the declared port carrying that name. A token
// whose port has no assigned host port yet is left as-is: honest and
// debuggable, it resolves once the port is allocated.
export const resolveManifestPlaceholders = (text, portsByName = {}) => {
  if (!text) {
    return text;
  }
  let resolved = text;
  if (typeof window !== 'undefined') {
    resolved = resolved.replace(/\{\{gladys_host\}\}/g, window.location.hostname);
  }
  // own-property check, never a plain lookup: `{{port:constructor}}` would
  // otherwise stringify the inherited Object constructor instead of
  // staying unresolved
  return resolved.replace(/\{\{port:([a-z0-9_]+)\}\}/g, (token, name) =>
    Object.prototype.hasOwnProperty.call(portsByName, name) ? `${portsByName[name]}` : token
  );
};

// Union of the hardware classes requested by the sub-container declarations
// of a manifest, in declaration order.
export const getRequestedHardwareClasses = containers => {
  const requestedClasses = [];
  (containers || []).forEach(container => {
    (container.devices || []).forEach(hardwareClass => {
      if (!requestedClasses.includes(hardwareClass)) {
        requestedClasses.push(hardwareClass);
      }
    });
  });
  return requestedClasses;
};

// Effective transport of a device, reported by the integration through the
// reserved GLADYS_TRANSPORT param (local | cloud | unreachable), or null.
export const getDeviceTransport = device => {
  const transportParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT');
  return transportParam ? transportParam.value : null;
};

// Degraded transport state, orthogonal to the transport value ("which
// channel is used" vs "is it the nominal state"): the device works, but
// not in its nominal mode — e.g. local detected but sessions refused,
// falling back to cloud. Rendered as an orange dot on the transport badge.
export const isDeviceTransportDegraded = device => {
  const degradedParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT_DEGRADED');
  return degradedParam ? degradedParam.value === 'true' : false;
};

// The reason of the degraded state (GLADYS_TRANSPORT_MESSAGE, a
// multi-language object serialized as JSON), localized, or null.
export const getDeviceTransportMessage = (device, language) => {
  const messageParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT_MESSAGE');
  if (!messageParam) {
    return null;
  }
  try {
    return getLocalizedText(JSON.parse(messageParam.value), language) || null;
  } catch (e) {
    return null;
  }
};
