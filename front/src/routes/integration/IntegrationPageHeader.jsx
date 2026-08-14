import get from 'get-value';
import { Text } from 'preact-i18n';
import CardFilter from '../../components/layout/CardFilter';
import InstallFromGithubCard from './all/external-integration/install-from-github/InstallFromGithubCard';
import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './style.css';

// while no search narrows the list down, the displayed count and the total of
// the current view are the same number: showing "75 of 75 integrations" is
// noise, the total alone says everything
const IntegrationCount = ({ searching, integrationsLength, totalSize }) =>
  searching ? (
    <Text id="integration.root.subtitle" fields={{ length: integrationsLength, total: totalSize }} />
  ) : (
    <Text id="integration.root.subtitleTotal" fields={{ total: totalSize }} />
  );

const IntegrationPageHeader = ({
  intl,
  orderDir,
  changeOrderDir,
  search,
  searchKeyword,
  integrationsLength,
  totalSize,
  showInstallFromGithub
}) => {
  const hasSearch = searchKeyword.length > 0;
  // a search matching every integration of the view leaves the list untouched,
  // so it is not a case for "X of Y" either
  const searchNarrowsView = hasSearch && integrationsLength < totalSize;
  // an empty view (the catalog still loading, no favorite yet) already displays
  // a message in the page body, "0 integrations" on top of it says nothing more
  const showCount = hasSearch || totalSize > 0;
  const searchPlaceholder = get(intl.dictionary, 'integration.root.searchPlaceholder', {
    default: ''
  });

  return (
    <>
      <div class={style.headerDesktop}>
        <div class="page-header">
          <h1 class="page-title">
            <Text id="integration.root.title" />
          </h1>
          {showCount && (
            <div class="page-subtitle">
              <IntegrationCount
                searching={searchNarrowsView}
                integrationsLength={integrationsLength}
                totalSize={totalSize}
              />
            </div>
          )}
          <div class="page-options d-flex align-items-center">
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
              extraOrderDirs={[{ value: 'newest', labelId: 'integration.root.orderDirNewest' }]}
            />
          </div>
        </div>
      </div>

      <div class={style.headerMobile}>
        <div class={style.mobileHeaderTop}>
          <h1 class={style.mobileTitle}>
            <Text id="integration.root.title" />
          </h1>
          <select onChange={changeOrderDir} class={`form-control custom-select ${style.mobileSort}`} value={orderDir}>
            <option value="asc">
              <Text id="global.orderDirAsc" />
            </option>
            <option value="desc">
              <Text id="global.orderDirDesc" />
            </option>
            <option value="newest">
              <Text id="integration.root.orderDirNewest" />
            </option>
          </select>
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
              searching={searchNarrowsView}
              integrationsLength={integrationsLength}
              totalSize={totalSize}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default withIntlAsProp(IntegrationPageHeader);
