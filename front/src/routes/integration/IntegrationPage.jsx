import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import IntegrationMenu from './IntegrationMenu';
import IntegrationCategory from './IntegrationCategory';
import actions from '../../actions/integration';
import PageOptions from '../../components/form/PageOptions';

@connect('integrations,currentUrl,totalSize,searchKeyword', actions)
class IntegrationPage extends Component {
  searchWithI18n = e => this.props.search(e, this.context.intl);

  render({ category, integrations, totalSize, currentUrl, searchKeyword }) {
    return (
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
                <PageOptions
                  debouncedSearch={this.searchWithI18n}
                  searchPlaceholder={<Text id="integration.root.searchPlaceholder" />}
                  searchValue={searchKeyword}
                />
              </div>
              <div class="row">
                <div class="col-lg-3">
                  <IntegrationMenu currentUrl={currentUrl} />
                </div>
                <div class="col-lg-9">
                  <div class="row row-cards">
                    {integrations &&
                      integrations.map(integration => (
                        <IntegrationCategory currentUrl={currentUrl} integration={integration} category={category} />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default IntegrationPage;
