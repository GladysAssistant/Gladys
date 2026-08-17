import { Text, MarkupText } from 'preact-i18n';
import IntegrationMenu, { IntegrationMenuMobile } from './IntegrationMenu';
import IntegrationCategory, { IntegrationListItem } from './IntegrationCategory';
import IntegrationFacets from './IntegrationFacets';
import IntegrationGatewayBanner from './IntegrationGatewayBanner';
import IntegrationPageHeader from './IntegrationPageHeader';
import StoreRefreshFooter from './all/external-integration/store-refresh/StoreRefreshFooter';
import style from './style.css';

const IntegrationPage = ({
  integrations,
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
              showInstallFromGithub={showInstallFromGithub}
            />
            <IntegrationMenuMobile
              integrationCategories={integrationCategories}
              integrationsToUpdate={integrationsToUpdate}
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
                  category={category}
                />
              </div>
              <div class="col-lg-9">
                <div class={`list-group list-group-flush ${style.mobileList}`}>
                  {integrations.map(integration => (
                    <IntegrationListItem
                      key={integration.key}
                      integration={integration}
                      toggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
                <div class={style.desktopGrid}>
                  <div class="row row-cards">
                    {integrations.map(integration => (
                      <IntegrationCategory
                        key={integration.key}
                        integration={integration}
                        toggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
                {integrations.length === 0 && (
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
                    ) : (
                      <Text id="integration.root.noIntegrations" />
                    )}
                  </div>
                )}
                {showStoreRefresh && (
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
