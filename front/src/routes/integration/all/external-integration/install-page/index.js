import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import NetworkDiscoverySummary from '../components/NetworkDiscoverySummary';
import { getLocalizedText, getGithubRepoUrl } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

class ExternalIntegrationInstallPage extends Component {
  getStoreIntegration = async () => {
    this.setState({ loadStatus: RequestStatus.Getting });
    try {
      const storeSlug = `${this.props.owner}/${this.props.repo}`;
      const [{ integrations = [] }, installedIntegrations] = await Promise.all([
        this.props.httpClient.get('/api/v1/external_integration/store'),
        this.props.httpClient.get('/api/v1/external_integration')
      ]);
      const storeIntegration = integrations.find(integration => integration.store_slug === storeSlug);
      this.setState({
        storeIntegration,
        duplicateOfInstalled: storeIntegration
          ? this.findDuplicateOfInstalled(storeIntegration, installedIntegrations)
          : null,
        loadStatus: storeIntegration ? RequestStatus.Success : RequestStatus.Error
      });
    } catch (e) {
      console.error(e);
      this.setState({ loadStatus: RequestStatus.Error });
    }
  };

  // two instances of the same integration (a dev build next to the prod
  // one) may fight over the same cloud account or devices: warn, but let
  // the user install anyway — it is a supported workflow
  findDuplicateOfInstalled = (storeIntegration, installedIntegrations) => {
    const manifest = storeIntegration.manifest || {};
    const imageWithoutTag = reference => (reference || '').split('@')[0].split(':')[0];
    return (
      (installedIntegrations || []).find(
        installed =>
          (manifest.docker_image &&
            imageWithoutTag(installed.docker_image) === imageWithoutTag(manifest.docker_image)) ||
          (manifest.name && get(installed, 'manifest.name') === manifest.name)
      ) || null
    );
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

  render(props, { storeIntegration, loadStatus, installStatus, duplicateOfInstalled }) {
    const language = get(props, 'user.language') || 'en';
    const manifest = (storeIntegration && storeIntegration.manifest) || {};
    const github = (storeIntegration && storeIntegration.github) || {};
    const docs = (storeIntegration && storeIntegration.docs) || {};
    const docsUrl = docs[language] || docs.en;
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
                                class="mr-4"
                              >
                                <i class="fe fe-github mr-1" />
                                {storeIntegration.store_slug}
                              </a>
                              {docsUrl && (
                                <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                                  <i class="fe fe-book-open mr-1" />
                                  <Text id="integration.externalIntegration.install.documentationLink" />
                                </a>
                              )}
                            </div>
                            <p>{getLocalizedText(manifest.description, language)}</p>

                            <div class="alert alert-warning">
                              <h4 class="alert-title">
                                <i class="fe fe-alert-triangle mr-1" />
                                <Text id="integration.externalIntegration.install.warningTitle" />
                              </h4>
                              <Text id="integration.externalIntegration.install.warningText" />
                            </div>

                            {manifest.type === 'communication' && (
                              <div class="alert alert-warning">
                                <i class="fe fe-message-circle mr-1" />
                                <Text id="integration.externalIntegration.install.communicationWarningText" />
                              </div>
                            )}

                            <NetworkDiscoverySummary networkDiscovery={manifest.network_discovery} />

                            {duplicateOfInstalled && (
                              <div class="alert alert-warning">
                                <h4 class="alert-title">
                                  <i class="fe fe-copy mr-1" />
                                  <Text id="integration.externalIntegration.install.duplicateWarningTitle" />
                                </h4>
                                <Text
                                  id="integration.externalIntegration.install.duplicateWarningText"
                                  fields={{ name: duplicateOfInstalled.name }}
                                />
                              </div>
                            )}

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
