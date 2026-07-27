import { categories } from '../../config/integrations';

const CATALOG_BASE_URL = '/dashboard/integration';
const DEFAULT_ORDER_DIR = 'asc';
const ORDER_DIRS = ['asc', 'desc'];

// the catalog is displayed for every category, plus "all" and "favorites":
// only those paths are accepted as a "back to the catalog" target
const CATALOG_PATHS = new Set([
  CATALOG_BASE_URL,
  `${CATALOG_BASE_URL}/favorites`,
  ...categories.map(category => `${CATALOG_BASE_URL}/${category.type}`)
]);

export const getCatalogPath = category => (category ? `${CATALOG_BASE_URL}/${category}` : CATALOG_BASE_URL);

const buildFilterParams = ({ searchKeyword, orderDir }) => {
  const urlParams = new URLSearchParams();
  if (searchKeyword) {
    urlParams.set('search', searchKeyword);
  }
  // the ascending order is the default one, no need to carry it around
  if (ORDER_DIRS.includes(orderDir) && orderDir !== DEFAULT_ORDER_DIR) {
    urlParams.set('order_dir', orderDir);
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
export const getCatalogUrl = ({ category, searchKeyword, orderDir }) =>
  withQuery(getCatalogPath(category), buildFilterParams({ searchKeyword, orderDir }));

export const getCatalogFilters = (queryString = window.location.search) => {
  const urlParams = new URLSearchParams(queryString);
  const orderDir = urlParams.get('order_dir');
  return {
    searchKeyword: urlParams.get('search') || '',
    // a hand-written URL could carry anything: an unknown direction would
    // leave the catalog unsorted and the sort selector out of sync
    orderDir: ORDER_DIRS.includes(orderDir) ? orderDir : DEFAULT_ORDER_DIR
  };
};

// an integration page opened from the catalog keeps the catalog it comes from
// ("from") and the filters that were applied, so that it can send the user
// back to where they were
export const getUrlFromCatalog = (path, { category, searchKeyword, orderDir }) => {
  const urlParams = buildFilterParams({ searchKeyword, orderDir });
  urlParams.set('from', getCatalogPath(category));
  return withQuery(path, urlParams);
};

export const getBackToCatalogUrl = (queryString = window.location.search) => {
  const from = new URLSearchParams(queryString).get('from');
  // the parameter comes from the URL: fall back to the whole catalog rather
  // than trusting an arbitrary path
  const path = CATALOG_PATHS.has(from) ? from : CATALOG_BASE_URL;
  return withQuery(path, buildFilterParams(getCatalogFilters(queryString)));
};
