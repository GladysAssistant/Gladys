import { Text, MarkupText } from 'preact-i18n';
import IntegrationMenu, { IntegrationMenuMobile } from './IntegrationMenu';
import IntegrationCategory, { IntegrationListItem } from './IntegrationCategory';
import IntegrationFacets from './IntegrationFacets';
import IntegrationGatewayBanner from './IntegrationGatewayBanner';
import IntegrationPageHeader from './IntegrationPageHeader';
import InstalledIntegrationsSummary from './InstalledIntegrationsSummary';
import IntegrationCatalogSkeleton from './IntegrationCatalogSkeleton';
import IntegrationLoadMore from './IntegrationLoadMore';
import StoreRefreshFooter from './all/external-integration/store-refresh/StoreRefreshFooter';
import { RequestStatus } from '../../utils/consts';
import style from './style.css';

// the community store could not be downloaded (and Gladys has no cached copy
// of it): the catalog holds the native integrations only, which must be said
// rather than leaving the user to believe that is all there is
const StoreUnavailableAlert = ({ refreshStore, refreshStoreStatus }) => (
  <div class="alert alert-warning d-flex align-items-center" role="alert">
    <i class="fe fe-wifi-off mr-2" />
    <div class="flex-fill">
      <Text id="integration.root.storeUnavailable" />
    </div>
    {refreshStore && (
      <button
        type="button"
        class={`btn btn-sm btn-warning ml-3 ${refreshStoreStatus === RequestStatus.Getting ? 'btn-loading' : ''}`}
        onClick={refreshStore}
        disabled={refreshStoreStatus === RequestStatus.Getting}
      >
        <Text id="integration.root.storeUnavailableRetry" />
      </button>
    )}
  </div>
);

const IntegrationList = ({ integrations, visibleCount, showMoreIntegrations, toggleFavorite, category }) => {
  const visibleIntegrations = integrations.slice(0, visibleCount);
  return (
    <div>
      <div class={`list-group list-group-flush ${style.mobileList}`}>
        {visibleIntegrations.map(integration => (
          <IntegrationListItem
            key={integration.key}
            integration={integration}
            toggleFavorite={toggleFavorite}
            alwaysShowStatus={category === 'installed'}
          />
        ))}
      </div>
      <div class={style.desktopGrid}>
        <div class="row row-cards">
          {visibleIntegrations.map(integration => (
            <IntegrationCategory
              key={integration.key}
              integration={integration}
              toggleFavorite={toggleFavorite}
              alwaysShowStatus={category === 'installed'}
            />
          ))}
        </div>
      </div>
      {integrations.length > visibleIntegrations.length && (
        <IntegrationLoadMore
          onLoadMore={showMoreIntegrations}
          remaining={integrations.length - visibleIntegrations.length}
        />
      )}
    </div>
  );
};

const IntegrationPage = ({
  integrations,
  catalogLoading,
  visibleCount,
  showMoreIntegrations,
  externalStoreUnavailable,
  totalSize,
  searchKeyword,
  user,
  orderDir,
  changeOrderDir,
  search,
  integrationCategories,
  toggleFavorite,
  showInstallFromGithub,
  showStoreRefresh,
  refreshStore,
  refreshStoreStatus,
  refreshStoreStale,
  integrationsToUpdate,
  installedIntegrationsCount,
  installedStatusCounts,
  installedInventoryKnown,
  category,
  origin,
  transports,
  gladysPlus,
  setOriginFacet,
  setTransportFacet,
  toggleGladysPlusFacet
}) => (
  <div class="page">
    <div class="page-main">
      <div class={`my-3 my-md-5 ${style.pageContainer}`}>
        {integrations && user && user.role && (
          <div class="container">
            <IntegrationPageHeader
              orderDir={orderDir}
              changeOrderDir={changeOrderDir}
              search={search}
              searchKeyword={searchKeyword || ''}
              integrationsLength={integrations.length}
              totalSize={totalSize}
              loading={catalogLoading}
              showInstallFromGithub={showInstallFromGithub}
            />
            <IntegrationMenuMobile
              integrationCategories={integrationCategories}
              integrationsToUpdate={integrationsToUpdate}
              installedIntegrationsCount={installedIntegrationsCount}
              category={category}
            />
            <IntegrationFacets
              origin={origin}
              transports={transports}
              gladysPlus={gladysPlus}
              setOriginFacet={setOriginFacet}
              setTransportFacet={setTransportFacet}
              toggleGladysPlusFacet={toggleGladysPlusFacet}
            />
            <IntegrationGatewayBanner />
            <div class="row">
              <div class={`col-lg-3 ${style.desktopMenuCol}`}>
                <IntegrationMenu
                  integrationCategories={integrationCategories}
                  integrationsToUpdate={integrationsToUpdate}
                  installedIntegrationsCount={installedIntegrationsCount}
                  category={category}
                />
              </div>
              <div class="col-lg-9">
                {/* the "Installed" view is the inventory of what runs on this
                    instance: it opens on the live state breakdown, and every
                    card wears its status badge — including the nominal ones,
                    hidden everywhere else in the catalog */}
                {category === 'installed' && installedIntegrationsCount > 0 && (
                  <InstalledIntegrationsSummary
                    installedIntegrationsCount={installedIntegrationsCount}
                    installedStatusCounts={installedStatusCounts}
                  />
                )}
                {!catalogLoading && externalStoreUnavailable && (
                  <StoreUnavailableAlert
                    refreshStore={showStoreRefresh ? refreshStore : null}
                    refreshStoreStatus={refreshStoreStatus}
                  />
                )}
                {catalogLoading ? (
                  <IntegrationCatalogSkeleton />
                ) : (
                  <IntegrationList
                    integrations={integrations}
                    visibleCount={visibleCount}
                    showMoreIntegrations={showMoreIntegrations}
                    toggleFavorite={toggleFavorite}
                    category={category}
                  />
                )}
                {!catalogLoading && integrations.length === 0 && (
                  <div class="text-center mt-6">
                    {searchKeyword && searchKeyword.length > 0 ? (
                      <div>
                        <p class="mb-3">
                          <Text id="integration.root.noSearchResults" fields={{ searchKeyword }} />
                        </p>
                        <MarkupText id="integration.root.noSearchResultsSuggestion" />
                      </div>
                    ) : category === 'updates' ? (
                      <Text id="integration.root.allIntegrationsUpToDate" />
                    ) : /* "nothing is installed here" is only true when the inventory is known
                         to be empty. A facet kept from another category can empty the card list
                         while integrations are installed, and a failed fetch leaves the inventory
                         unknown: both fall back to the generic empty state, so the body never
                         contradicts the summary above it */
                    category === 'installed' && installedInventoryKnown && installedIntegrationsCount === 0 ? (
                      <Text id="integration.root.noInstalledIntegrations" />
                    ) : (
                      <Text id="integration.root.noIntegrations" />
                    )}
                  </div>
                )}
                {showStoreRefresh && !catalogLoading && (
                  <StoreRefreshFooter onRefresh={refreshStore} status={refreshStoreStatus} stale={refreshStoreStale} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default IntegrationPage;
