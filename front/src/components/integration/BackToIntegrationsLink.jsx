import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { getBackToCatalogUrl } from '../../routes/integration/catalog-url';

// Every integration page is reached from the integration catalog, but nothing
// on the page led back to it: on mobile especially, the browser back button
// was the only way out. The link points at the catalog view the user came
// from, with its category, search and sort order. Only the install page
// carries them in its own query string; the other integration routes cannot
// (see catalog-url.js) and rely on the catalog view remembered there. Both
// fall back to the whole catalog.
const BackToIntegrationsLink = () => (
  <div class="mb-4">
    <Link href={getBackToCatalogUrl()} class="btn btn-secondary btn-sm">
      <i class="fe fe-arrow-left mr-1" />
      <Text id="integration.backToIntegrations" />
    </Link>
  </div>
);

export default BackToIntegrationsLink;
