import get from 'get-value';
import { Text } from 'preact-i18n';
import CardFilter from '../../components/layout/CardFilter';
import SortSelect from '../../components/layout/SortSelect';
import InstallFromGithubCard from './all/external-integration/install-from-github/InstallFromGithubCard';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { forgetSearchFocus, hasPendingSearchFocus } from './catalog-url';
import style from './style.css';

// the count is always compared to the whole catalog: "42 of 810 integrations"
// says at a glance how much the shelf, the facets or the search narrow it.
// While nothing does, the two numbers are the same and "810 of 810" is noise:
// the total alone says everything. Next to a narrowed count, one link releases
// every filter at once.
// while the community integrations load, the only count we could give is the
// one of the native integrations: a small number that would read as the size
// of the whole catalog. The header says the catalog is loading instead.
const IntegrationCount = ({ loading, narrowed, integrationsLength, totalSize, hasActiveFilters, clearFilters }) => {
  if (loading) {
    return (
      <span role="status">
        <span class={style.loadingDot} aria-hidden="true" />
        <Text id="integration.root.loadingCatalog" />
      </span>
    );
  }
  return (
    <span>
      {narrowed ? (
        <Text id="integration.root.subtitle" fields={{ length: integrationsLength, total: totalSize }} />
      ) : (
        <Text id="integration.root.subtitleTotal" fields={{ total: totalSize }} />
      )}
      {hasActiveFilters && clearFilters && (
        <span>
          {' · '}
          <button type="button" class={`btn btn-link p-0 align-baseline ${style.clearFilters}`} onClick={clearFilters}>
            <Text id="integration.root.clearFilters" />
          </button>
        </span>
      )}
    </span>
  );
};

const ORDER_DIR_OPTIONS = [
  { value: 'asc', labelId: 'global.orderDirAsc' },
  { value: 'desc', labelId: 'global.orderDirDesc' },
  { value: 'newest', labelId: 'integration.root.orderDirNewest' },
  { value: 'updated', labelId: 'integration.root.orderDirUpdated' }
];

// gives the focus back to the search field when the view the user was typing
// in was just replaced by "All integrations" (catalog-url.js): the field of
// the header that is displayed, desktop or mobile, the other one being hidden
// by CSS. Module-level so that the ref is stable: called on mount only
const restoreSearchFocus = root => {
  if (!root || !hasPendingSearchFocus()) {
    return;
  }
  const input = Array.from(root.querySelectorAll('input.form-control')).find(element => element.offsetParent !== null);
  if (!input) {
    return;
  }
  forgetSearchFocus();
  input.focus();
  const caret = input.value.length;
  input.setSelectionRange(caret, caret);
};

const IntegrationPageHeader = ({
  intl,
  orderDir,
  changeOrderDir,
  search,
  searchKeyword,
  integrationsLength,
  totalSize,
  loading,
  showInstallFromGithub,
  hasActiveFilters,
  clearFilters
}) => {
  const hasSearch = searchKeyword.length > 0;
  // "X of Y" only when a filter the user chose narrows the view: the country
  // scope alone shows the bare count of what is displayed, and the line under
  // the header says what it hides — "797 of 809" with no filter and nothing
  // to clear would read as a filter the user cannot find
  const narrowed = hasActiveFilters && integrationsLength < totalSize;
  // an empty view (the catalog still loading, no favorite yet) already displays
  // a message in the page body, "0 integrations" on top of it says nothing more
  const showCount = loading || hasSearch || totalSize > 0;
  const searchPlaceholder = get(intl.dictionary, 'integration.root.searchPlaceholder', {
    default: ''
  });

  return (
    <>
      <div class={style.headerDesktop} ref={restoreSearchFocus}>
        <div class="page-header">
          {/* the count sits under the title, not next to it: as a second
              column item it never pushes the sort and search controls to a
              second line, whatever its length ("130 of 809 integrations ·
              Clear filters" on every large shelf) — and the search field no
              longer moves under the cursor as the count changes while typing */}
          <div class={style.headerTitleBlock}>
            <h1 class="page-title">
              <Text id="integration.root.title" />
            </h1>
            {showCount && (
              <div class={`page-subtitle ${style.headerSubtitle}`}>
                <IntegrationCount
                  loading={loading}
                  narrowed={narrowed}
                  integrationsLength={integrationsLength}
                  totalSize={totalSize}
                  hasActiveFilters={hasActiveFilters}
                  clearFilters={clearFilters}
                />
              </div>
            )}
          </div>
          <div class={`page-options d-flex align-items-center ${style.headerOptions}`}>
            {showInstallFromGithub && (
              <div class="mr-3">
                <InstallFromGithubCard button />
              </div>
            )}
            <CardFilter
              changeOrderDir={changeOrderDir}
              orderValue={orderDir}
              search={search}
              searchValue={searchKeyword}
              searchPlaceHolder={searchPlaceholder}
              extraOrderDirs={ORDER_DIR_OPTIONS.slice(2)}
            />
          </div>
        </div>
      </div>

      <div class={style.headerMobile} ref={restoreSearchFocus}>
        <div class={style.mobileHeaderTop}>
          <h1 class={style.mobileTitle}>
            <Text id="integration.root.title" />
          </h1>
          <SortSelect
            value={orderDir}
            onChange={changeOrderDir}
            selectClass={style.mobileSort}
            options={ORDER_DIR_OPTIONS}
          />
        </div>
        <div class={style.mobileSearch}>
          <div class="input-icon">
            <span class="input-icon-addon">
              <i class="fe fe-search" />
            </span>
            <input
              type="text"
              class="form-control"
              placeholder={searchPlaceholder}
              onInput={search}
              value={searchKeyword}
            />
          </div>
        </div>
        {showInstallFromGithub && (
          <div class="mt-4">
            <InstallFromGithubCard button block />
          </div>
        )}
        {showCount && (
          <div class={style.mobileResultCount}>
            <IntegrationCount
              loading={loading}
              narrowed={narrowed}
              integrationsLength={integrationsLength}
              totalSize={totalSize}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default withIntlAsProp(IntegrationPageHeader);
