import { connect } from 'unistore/preact';
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
            <h1 class="page-title">Integrations</h1>
            <div class="page-subtitle">
              1 - {integrations.length} of {totalSize} integrations
            </div>
            <div class="page-options d-flex">
              <select class="form-control custom-select w-auto">
                <option value="asc">A - Z</option>
                <option value="desc">Z - A</option>
              </select>
              <div class="input-icon ml-2">
                <span class="input-icon-addon">
                  <i class="fe fe-search" />
                </span>
                <input type="text" class="form-control w-10" placeholder="Search integrations" onInput={search} />
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
