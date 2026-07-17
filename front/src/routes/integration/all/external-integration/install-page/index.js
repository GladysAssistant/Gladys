import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { getLocalizedText, getGithubRepoUrl } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

class ExternalIntegrationInstallPage extends Component {
  getStoreIntegration = async () => {
    this.setState({ loadStatus: RequestStatus.Getting });
    try {
      const storeSlug = `${this.props.owner}/${this.props.repo}`;
      const { integrations = [] } = await this.props.httpClient.get('/api/v1/external_integration/store');
      const storeIntegration = integrations.find(integration => integration.store_slug === storeSlug);
      this.setState({
        storeIntegration,
        loadStatus: storeIntegration ? RequestStatus.Success : RequestStatus.Error
      });
    } catch (e) {
      console.error(e);
      this.setState({ loadStatus: RequestStatus.Error });
    }
  };

  install = async () => {
    this.setState({ installStatus: RequestStatus.Getting });
    try {
      const storeSlug = `${this.props.owner}/${this.props.repo}`;
      const installed = await this.props.httpClient.post('/api/v1/external_integration', {
        store_slug: storeSlug
      });
      route(`/dashboard/integration/device/external/${installed.selector}`);
    } catch (e) {
      console.error(e);
      this.setState({ installStatus: RequestStatus.Error });
    }
  };

  componentWillMount() {
    this.getStoreIntegration();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.owner !== this.props.owner || prevProps.repo !== this.props.repo) {
      this.getStoreIntegration();
    }
  }

  render(props, { storeIntegration, loadStatus, installStatus }) {
    const language = get(props, 'user.language') || 'en';
    const manifest = (storeIntegration && storeIntegration.manifest) || {};
    const github = (storeIntegration && storeIntegration.github) || {};
    const installing = installStatus === RequestStatus.Getting;
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row justify-content-center">
                <div class="col-lg-8">
                  <div class="mb-4">
                    <Link href="/dashboard/integration/device" class="btn btn-secondary btn-sm">
                      <i class="fe fe-arrow-left mr-1" />
                      <Text id="integration.externalIntegration.install.backToCatalog" />
                    </Link>
                  </div>
                  <div
                    class={cx('dimmer', {
                      active: loadStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {loadStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.externalIntegration.install.notFound" />
                        </div>
                      )}
                      {storeIntegration && (
                        <div class="card">
                          {storeIntegration.cover_url || manifest.cover_image ? (
                            <img
                              class="card-img-top"
                              src={storeIntegration.cover_url || manifest.cover_image}
                              alt={manifest.name}
                            />
                          ) : (
                            <div class={style.coverPlaceholder}>
                              <i class="fe fe-package" />
                            </div>
                          )}
                          <div class="card-body">
                            <h2>{manifest.name || storeIntegration.store_slug}</h2>
                            <div class="text-muted mb-3">
                              <span class="mr-4">
                                <i class="fe fe-star mr-1" />
                                {github.stars || 0} <Text id="integration.externalIntegration.install.starsLabel" />
                              </span>
                              {github.pushed_at && (
                                <span class="mr-4">
                                  <i class="fe fe-git-commit mr-1" />
                                  <Text id="integration.externalIntegration.install.lastPushLabel" />{' '}
                                  {new Date(github.pushed_at).toLocaleDateString(language)}
                                </span>
                              )}
                              <a
                                href={storeIntegration.repo_url || getGithubRepoUrl(storeIntegration.store_slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i class="fe fe-github mr-1" />
                                {storeIntegration.store_slug}
                              </a>
                            </div>
                            <p>{getLocalizedText(manifest.description, language)}</p>

                            <div class="alert alert-warning">
                              <h4 class="alert-title">
                                <i class="fe fe-alert-triangle mr-1" />
                                <Text id="integration.externalIntegration.install.warningTitle" />
                              </h4>
                              <Text id="integration.externalIntegration.install.warningText" />
                            </div>

                            {storeIntegration.compatible === false && (
                              <div class="alert alert-danger">
                                <Text id="integration.externalIntegration.install.notCompatible" />
                              </div>
                            )}
                            {installStatus === RequestStatus.Error && (
                              <div class="alert alert-danger">
                                <Text id="integration.externalIntegration.install.installError" />
                              </div>
                            )}

                            {storeIntegration.installed ? (
                              <div>
                                <div class="alert alert-info">
                                  <Text id="integration.externalIntegration.install.alreadyInstalled" />
                                </div>
                                <Link
                                  href={`/dashboard/integration/device/external/${storeIntegration.installed_selector}`}
                                  class="btn btn-primary"
                                >
                                  <Text id="integration.externalIntegration.install.goToIntegrationButton" />
                                </Link>
                              </div>
                            ) : (
                              <button
                                class={cx('btn btn-success', {
                                  'btn-loading': installing
                                })}
                                onClick={this.install}
                                disabled={installing || storeIntegration.compatible === false}
                              >
                                <i class="fe fe-download mr-1" />
                                {installing ? (
                                  <Text id="integration.externalIntegration.install.installing" />
                                ) : (
                                  <Text id="integration.externalIntegration.install.installButton" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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

export default connect('user,httpClient')(ExternalIntegrationInstallPage);
