import { integrationsByType } from '../../config/integrations';

// The URL segment of an integration page is also the service name on the
// server side (see server/services/index.js), so it lets us link a device
// back to the integration it comes from.
const integrationBySlug = {};
integrationsByType.device.forEach(integration => {
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
    return { slug: service.name, name: service.name, url, deviceUrl: url };
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
