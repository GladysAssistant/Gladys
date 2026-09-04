import get from 'get-value';

import { integrations } from '../../../config/integrations';
import { SERVICE_TYPES } from '../../../../../server/utils/constants';

/**
 * Returns how a service should be presented in the services list:
 * - slug: identity of the service in the list (its selector, unique)
 * - i18nKey: translation key of the integration name (built-in integrations)
 * - name: raw name to display when there is no translation
 * - external: true for a community integration
 * - discriminant: technical identity, displayed only when two integrations
 *   share the same name (see utils/integrationNames)
 * - url: integration page of the service, when it has one
 * @param {object} service - Service returned by the API.
 * @returns {object} Display identity of the service.
 */
function getServiceIntegration(service) {
  if (service.type === SERVICE_TYPES.EXTERNAL) {
    // The service name is the technical selector (ext-<owner>-<repo>): display
    // the manifest name, the same title as the integration card in the catalog
    return {
      slug: service.selector,
      name: get(service, 'manifest.name') || service.name,
      external: true,
      // the store slug (owner/repo) reads better than the selector built from
      // it; dev installs have none, their selector is the only identity
      discriminant: service.store_slug || service.selector,
      // all community integrations share the same parameterized page; the
      // communication and weather ones redirect from there to their config
      // screen, so this single URL is right for every type
      url: `/dashboard/integration/device/external/${service.selector}`
    };
  }
  const integrationPage = integrations.find(
    integration => get(integration, 'link', { default: integration.key }).toLowerCase() === service.selector
  );
  if (!integrationPage) {
    // Service without a front-end page (usb, example...): no link
    return { slug: service.selector, name: service.name, url: null };
  }
  return {
    slug: service.selector,
    i18nKey: `integration.${integrationPage.key}.title`,
    name: service.name,
    url: `/dashboard/integration/${integrationPage.type}/${(integrationPage.link || integrationPage.key).toLowerCase()}`
  };
}

export default getServiceIntegration;
