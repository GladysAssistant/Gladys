import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { getBackToCatalogUrl } from '../../routes/integration/catalog-url';

// Every integration page is reached from the integration catalog, but nothing
// on the page led back to it: on mobile especially, the browser back button
// was the only way out. The link points at the catalog view the user came
// from (category, search and sort order travel in the URL), and falls back to
// the whole catalog when the page was opened directly.
const BackToIntegrationsLink = () => (
  <div class="mb-4">
    <Link href={getBackToCatalogUrl()} class="btn btn-secondary btn-sm">
      <i class="fe fe-arrow-left mr-1" />
      <Text id="integration.backToIntegrations" />
    </Link>
  </div>
);

export default BackToIntegrationsLink;
