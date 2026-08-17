import { integrations } from '../../config/integrations';

// The URL segment of an integration page is also the service name on the
// server side (see server/services/index.js), so it lets us link a device
// back to the integration it comes from.
const integrationBySlug = {};
integrations
  .filter(integration => integration.type === 'device')
  .forEach(integration => {
    integrationBySlug[(integration.link || integration.key).toLowerCase()] = integration;
  });

// Integrations whose device list lives on a sub-page of the integration
const DEVICE_LIST_SUFFIX = {
  'philips-hue': '/device',
  'tp-link': '/device'
};

// Integrations with a page per device: link straight to the device
const DEVICE_EDIT_LINKS = {
  mqtt: selector => `/dashboard/integration/device/mqtt/edit/${selector}`,
  zigbee2mqtt: selector => `/dashboard/integration/device/zigbee2mqtt/edit/${selector}`,
  xiaomi: selector => `/dashboard/integration/device/xiaomi/edit/${selector}`,
  tasmota: selector => `/dashboard/integration/device/tasmota/edit/${selector}`,
  ewelink: selector => `/dashboard/integration/device/ewelink/edit/${selector}`,
  tuya: selector => `/dashboard/integration/device/tuya/edit/${selector}`,
  melcloud: selector => `/dashboard/integration/device/melcloud/edit/${selector}`,
  broadlink: selector => `/dashboard/integration/device/broadlink/edit/${selector}`,
  bluetooth: selector => `/dashboard/integration/device/bluetooth/${selector}`
};

/**
 * Returns where a device comes from and where to open it:
 * - slug: identifier used to filter devices by integration
 * - i18nKey: translation key of the integration name (built-in integrations)
 * - name: raw name to display when there is no translation
 * - external: true for a community integration (own group in the filter)
 * - discriminant: technical identity, displayed only when two integrations
 *   share the same name (see disambiguateIntegrationNames)
 * - url: integration page listing the devices
 * - deviceUrl: most specific page for this device in its integration
 */
export function getDeviceIntegration(device) {
  const { service } = device;
  if (!service || !service.name) {
    return null;
  }
  if (service.type === 'external') {
    // External integrations (Docker containers) all share the same routes,
    // parameterized by the service selector (which is also its name)
    const url = `/dashboard/integration/device/external/${service.selector || service.name}`;
    // The service name is the technical selector (ext-<owner>-<repo>): display
    // the manifest name, the same title as the integration card in the catalog
    const name = (service.manifest && service.manifest.name) || service.name;
    return {
      slug: service.name,
      name,
      external: true,
      // the store slug (owner/repo) reads better than the selector built from
      // it; dev installs have none, their selector is the only identity
      discriminant: service.store_slug || service.selector || service.name,
      url,
      deviceUrl: url
    };
  }
  const slug = service.name.toLowerCase();
  const integration = integrationBySlug[slug];
  if (!integration) {
    // Service without a front-end page (usb, example...): no link
    return { slug, name: service.name, url: null, deviceUrl: null };
  }
  const url = `/dashboard/integration/device/${slug}${DEVICE_LIST_SUFFIX[slug] || ''}`;
  const buildDeviceLink = DEVICE_EDIT_LINKS[slug];
  return {
    slug,
    i18nKey: `integration.${integration.key}.title`,
    name: service.name,
    url,
    deviceUrl: buildDeviceLink ? buildDeviceLink(device.selector) : url
  };
}

/**
 * Two community integrations can display the same name (two repositories
 * publishing a manifest with the same name, or two dev installs of the same
 * integration): those are the only ones that carry their technical identity
 * next to their name, so the common case stays readable. Built-in integrations
 * have unique names, and are told apart from community ones by their own group
 * in the filter and by the "community" tag in the list.
 * @param {Array} integrations - Integrations of the listed devices, with duplicates.
 * @returns {Map} Name to display, by integration slug.
 */
export function disambiguateIntegrationNames(integrations) {
  // names are compared lowercased: two manifests differing only by case read
  // as the same name in the list
  const slugsByName = new Map();
  integrations.forEach(integration => {
    if (integration && integration.external) {
      const key = integration.name.toLowerCase();
      const slugs = slugsByName.get(key) || new Set();
      slugs.add(integration.slug);
      slugsByName.set(key, slugs);
    }
  });
  const nameBySlug = new Map();
  integrations.forEach(integration => {
    if (!integration || nameBySlug.has(integration.slug)) {
      return;
    }
    const isDuplicated = integration.external && slugsByName.get(integration.name.toLowerCase()).size > 1;
    nameBySlug.set(
      integration.slug,
      isDuplicated ? `${integration.name} (${integration.discriminant})` : integration.name
    );
  });
  return nameBySlug;
}
