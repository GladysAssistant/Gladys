import { Text, MarkupText } from 'preact-i18n';
import IntegrationMenu, { IntegrationMenuMobile } from './IntegrationMenu';
import IntegrationCategory, { IntegrationListItem } from './IntegrationCategory';
import IntegrationPageHeader from './IntegrationPageHeader';
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
  toggleFavorite
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
            />
            <IntegrationMenuMobile integrationCategories={integrationCategories} />
            <div class="alert alert-info mb-4">
              <h4 class="alert-title">
                <Text id="integration.root.gatewayBanner.title" />
              </h4>
              <MarkupText id="integration.root.gatewayBanner.description" />
            </div>
            <div class="row">
              <div class={`col-lg-3 ${style.desktopMenuCol}`}>
                <IntegrationMenu integrationCategories={integrationCategories} />
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
                    ) : (
                      <Text id="integration.root.noIntegrations" />
                    )}
                  </div>
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
