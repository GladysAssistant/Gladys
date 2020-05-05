import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import IntegrationMenu from './IntegrationMenu';
import IntegrationCategory from './IntegrationCategory';
import actions from '../../actions/integration';

const IntegrationPage = connect(
  'integrations,currentUrl,integrationsFiltered,totalSize',
  actions
)(({ integrations, integrationsFiltered, totalSize, currentUrl, search }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Text id="integration.root.title" />
            </h1>
            <div class="page-subtitle">
              <Text id="integration.root.subtitle" fields={{ length: integrations.length, total: totalSize }} />
            </div>
            <div class="page-options d-flex">
              <select class="form-control custom-select w-auto">
                <option value="asc">
                  <Text id="global.orderDirAsc" />
                </option>
                <option value="desc">
                  <Text id="global.orderDirDesc" />
                </option>
              </select>
              <div class="input-icon ml-2">
                <span class="input-icon-addon">
                  <i class="fe fe-search" />
                </span>
                <Localizer>
                  <input
                    type="text"
                    class="form-control w-10"
                    placeholder={<Text id="integration.root.searchPlaceholder" />}
                    onInput={search}
                  />
                </Localizer>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-lg-3">
              <IntegrationMenu currentUrl={currentUrl} />
            </div>
            <div class="col-lg-9">
              {integrations && (
                <IntegrationCategory currentUrl={currentUrl} integrations={integrationsFiltered || integrations} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

export default IntegrationPage;
