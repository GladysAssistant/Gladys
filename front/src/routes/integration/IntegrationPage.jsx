import { Text, Localizer } from 'preact-i18n';
import IntegrationMenu from './IntegrationMenu';
import IntegrationCategory from './IntegrationCategory';
import CardFilter from '../../components/layout/CardFilter';

const IntegrationPage = ({
  category,
  integrations,
  totalSize,
  currentUrl,
  searchKeyword,
  user,
  orderDir,
  changeOrderDir,
  search,
  integrationCategories
}) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        {integrations && user && user.role && (
          <div class="container">
            <div class="page-header">
              <h1 class="page-title">
                <Text id="integration.root.title" />
              </h1>
              <div class="page-subtitle">
                <Text id="integration.root.subtitle" fields={{ length: integrations.length, total: totalSize }} />
              </div>
              <div class="page-options d-flex">
                <Localizer>
                  <CardFilter
                    changeOrderDir={changeOrderDir}
                    orderValue={orderDir}
                    search={search}
                    searchValue={searchKeyword}
                    searchPlaceHolder={<Text id="integration.root.searchPlaceholder" />}
                  />
                </Localizer>
              </div>
            </div>
            <div class="row">
              <div class="col-lg-3">
                <IntegrationMenu integrationCategories={integrationCategories} />
              </div>
              <div class="col-lg-9">
                <div class="row row-cards">
                  {integrations.map(integration => (
                    <IntegrationCategory currentUrl={currentUrl} integration={integration} category={category} />
                  ))}
                  {integrations.length === 0 && (
                    <div class="col-12">
                      <div class="text-center mt-6">
                        <Text id="integration.root.noIntegrations" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default IntegrationPage;
