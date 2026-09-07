import { catalogCategories } from '../../config/integrations';

const CATALOG_BASE_URL = '/dashboard/integration';
const DEFAULT_ORDER_DIR = 'asc';
const ORDER_DIRS = ['asc', 'desc', 'newest'];
// cumulative facet filters (spec §4): technical attributes, orthogonal to the
// browse categories — they live in the query string like the other filters
const FACET_ORIGINS = ['native', 'community'];
const FACET_TRANSPORTS = ['local', 'cloud'];

// the catalog is displayed for every category, plus "all", "favorites",
// "updates" and "installed": only those paths are accepted as a "back to the
// catalog" target
const CATALOG_PATHS = new Set([
  CATALOG_BASE_URL,
  `${CATALOG_BASE_URL}/favorites`,
  `${CATALOG_BASE_URL}/updates`,
  `${CATALOG_BASE_URL}/installed`,
  ...catalogCategories.map(category => `${CATALOG_BASE_URL}/${category.key}`)
]);

export const getCatalogPath = category => (category ? `${CATALOG_BASE_URL}/${category}` : CATALOG_BASE_URL);

// the transport facet is multi-valued: both chips selected is a union
// ("declares local OR cloud"), which is not the same view as no chip at all —
// integrations with no declared transport match neither. Normalized against
// the enum and sorted so equivalent selections produce the same URL.
const normalizeTransports = transports =>
  FACET_TRANSPORTS.filter(value => (Array.isArray(transports) ? transports.includes(value) : false));

const buildFilterParams = ({ searchKeyword, orderDir, origin, transports, gladysPlus }) => {
  const urlParams = new URLSearchParams();
  if (searchKeyword) {
    urlParams.set('search', searchKeyword);
  }
  // the ascending order is the default one, no need to carry it around
  if (ORDER_DIRS.includes(orderDir) && orderDir !== DEFAULT_ORDER_DIR) {
    urlParams.set('order_dir', orderDir);
  }
  if (FACET_ORIGINS.includes(origin)) {
    urlParams.set('origin', origin);
  }
  const normalizedTransports = normalizeTransports(transports);
  if (normalizedTransports.length > 0) {
    urlParams.set('transport', normalizedTransports.join(','));
  }
  if (gladysPlus) {
    urlParams.set('plus', '1');
  }
  return urlParams;
};

const withQuery = (path, urlParams) => {
  const queryString = urlParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

// the filters live in the URL so that coming back to the catalog (with the
// browser back button or with a "back to integrations" link) restores the
// exact view the user left
export const getCatalogUrl = ({ category, searchKeyword, orderDir, origin, transports, gladysPlus }) =>
  withQuery(getCatalogPath(category), buildFilterParams({ searchKeyword, orderDir, origin, transports, gladysPlus }));

export const getCatalogFilters = (queryString = window.location.search) => {
  const urlParams = new URLSearchParams(queryString);
  const orderDir = urlParams.get('order_dir');
  const origin = urlParams.get('origin');
  const transportParam = urlParams.get('transport');
  return {
    searchKeyword: urlParams.get('search') || '',
    // a hand-written URL could carry anything: an unknown direction would
    // leave the catalog unsorted and the sort selector out of sync
    orderDir: ORDER_DIRS.includes(orderDir) ? orderDir : DEFAULT_ORDER_DIR,
    // same rule for the facets: an unknown value means "no filter"
    origin: FACET_ORIGINS.includes(origin) ? origin : null,
    transports: normalizeTransports(transportParam ? transportParam.split(',') : []),
    gladysPlus: urlParams.get('plus') === '1'
  };
};

// an integration page opened from the catalog keeps the catalog it comes from
// ("from") and the filters that were applied, so that it can send the user
// back to where they were
export const getUrlFromCatalog = (path, { category, searchKeyword, orderDir, origin, transports, gladysPlus }) => {
  const urlParams = buildFilterParams({ searchKeyword, orderDir, origin, transports, gladysPlus });
  urlParams.set('from', getCatalogPath(category));
  return withQuery(path, urlParams);
};

// last catalog view the user visited. The native integration pages cannot
// carry the filters in their own URL the way the install page does: their
// query string is handed to the page component as props by preact-router,
// where a "search" parameter would shadow the search action of the pages that
// have one. Remembering the catalog here keeps their back link accurate
// without touching their URL — a page reload simply forgets it and the link
// falls back to the whole catalog.
let lastCatalogUrl = null;

export const rememberCatalogUrl = url => {
  lastCatalogUrl = url;
};

// a remembered URL carries its filters in the query string, so only its path
// is compared to the known catalog views. It is written from getCatalogUrl()
// alone today: checking it keeps the guarantee held by the "from" parameter,
// that this helper never sends the user outside of the catalog
const isCatalogUrl = url => typeof url === 'string' && CATALOG_PATHS.has(url.split('?')[0]);

export const getBackToCatalogUrl = (queryString = window.location.search) => {
  const from = new URLSearchParams(queryString).get('from');
  // the parameter comes from the URL: fall back to the last catalog seen, then
  // to the whole catalog, rather than trusting an arbitrary path
  if (!CATALOG_PATHS.has(from)) {
    return isCatalogUrl(lastCatalogUrl)
      ? lastCatalogUrl
      : withQuery(CATALOG_BASE_URL, buildFilterParams(getCatalogFilters(queryString)));
  }
  return withQuery(from, buildFilterParams(getCatalogFilters(queryString)));
};
