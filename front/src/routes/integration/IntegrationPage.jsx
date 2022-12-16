import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import IntegrationMenu from './IntegrationMenu';
import IntegrationCategory from './IntegrationCategory';

class IntegrationPage extends Component {
  changeOrderDirWithI18n = e => this.props.changeOrderDir(e, this.props.intl);
  searchWithI18n = e => this.props.search(e, this.props.intl);

  render(props) {
    const { category, integrations, totalSize, currentUrl, searchKeyword, user, orderDir } = props;
    return (
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
                    <select class="form-control custom-select w-auto" onChange={this.changeOrderDirWithI18n}>
                      <option value="asc" selected={orderDir === 'asc'}>
                        <Text id="global.orderDirAsc" />
                      </option>
                      <option value="desc" selected={orderDir === 'desc'}>
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
                          value={searchKeyword}
                          onInput={this.searchWithI18n}
                        />
                      </Localizer>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-lg-3">
                    <IntegrationMenu {...props} />
                  </div>
                  <div class="col-lg-9">
                    <div class="row row-cards">
                      {integrations.map(integration => (
                        <IntegrationCategory currentUrl={currentUrl} integration={integration} category={category} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default IntegrationPage;
