import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import Modal from '../components/Modal';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

class InstallFromGithubCard extends Component {
  openModal = e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      modalOpen: true,
      devMode: false,
      repoUrl: '',
      dockerImage: '',
      manifestJson: '',
      installStatus: null,
      installError: null
    });
  };

  closeModal = () => {
    this.setState({ modalOpen: false });
  };

  toggleDevMode = e => {
    e.preventDefault();
    this.setState({ devMode: !this.state.devMode, installError: null });
  };

  updateRepoUrl = e => {
    this.setState({ repoUrl: e.target.value });
  };

  updateDockerImage = e => {
    this.setState({ dockerImage: e.target.value });
  };

  updateManifestJson = e => {
    this.setState({ manifestJson: e.target.value });
  };

  install = async body => {
    this.setState({ installStatus: RequestStatus.Getting, installError: null });
    try {
      const installed = await this.props.httpClient.post('/api/v1/external_integration', body);
      route(`/dashboard/integration/device/external/${installed.selector}`);
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      let installError = 'integration.externalIntegration.installFromGithub.errorUnknown';
      if (status === 404) {
        installError = 'integration.externalIntegration.installFromGithub.errorNotFound';
      } else if (status === 422) {
        installError = 'integration.externalIntegration.installFromGithub.errorInvalidManifest';
      }
      this.setState({ installStatus: RequestStatus.Error, installError });
    }
  };

  installFromRepoUrl = e => {
    if (e) {
      e.preventDefault();
    }
    const { repoUrl } = this.state;
    if (!repoUrl || repoUrl.trim().length === 0) {
      return;
    }
    this.install({ repo_url: repoUrl.trim() });
  };

  installFromDockerImage = e => {
    if (e) {
      e.preventDefault();
    }
    const { dockerImage, manifestJson } = this.state;
    if (!dockerImage || dockerImage.trim().length === 0) {
      return;
    }
    const body = { docker_image: dockerImage.trim() };
    if (manifestJson && manifestJson.trim().length > 0) {
      try {
        body.manifest = JSON.parse(manifestJson);
      } catch (err) {
        this.setState({
          installStatus: RequestStatus.Error,
          installError: 'integration.externalIntegration.installFromGithub.manifestInvalidJson'
        });
        return;
      }
    }
    this.install(body);
  };

  renderModal({ devMode, repoUrl, dockerImage, manifestJson, installStatus, installError }) {
    const installing = installStatus === RequestStatus.Getting;
    return (
      <Modal
        title={<Text id="integration.externalIntegration.installFromGithub.modalTitle" />}
        onClose={this.closeModal}
      >
        <div class="card-body">
          {installError && (
            <div class="alert alert-danger">
              <Text id={installError} />
            </div>
          )}
          <form onSubmit={this.installFromRepoUrl}>
            <div class="form-group">
              <label class="form-label" for="externalRepoUrl">
                <Text id="integration.externalIntegration.installFromGithub.repoUrlLabel" />
              </label>
              <Localizer>
                <input
                  id="externalRepoUrl"
                  type="text"
                  class="form-control"
                  value={repoUrl}
                  onInput={this.updateRepoUrl}
                  placeholder={<Text id="integration.externalIntegration.installFromGithub.repoUrlPlaceholder" />}
                />
              </Localizer>
            </div>
            <button
              type="submit"
              class={cx('btn btn-success', {
                'btn-loading': installing && !devMode
              })}
              disabled={installing || !repoUrl || repoUrl.trim().length === 0}
            >
              <i class="fe fe-download mr-1" />
              <Text id="integration.externalIntegration.installFromGithub.installButton" />
            </button>
          </form>

          <div class="mt-4">
            <a href="#" onClick={this.toggleDevMode} class="text-muted small">
              <i class={`fe mr-1 ${devMode ? 'fe-chevron-down' : 'fe-chevron-right'}`} />
              <Text id="integration.externalIntegration.installFromGithub.devModeLink" />
            </a>
          </div>

          {devMode && (
            <form onSubmit={this.installFromDockerImage} class="mt-3">
              <p class="text-muted small">
                <Text id="integration.externalIntegration.installFromGithub.devModeDescription" />
              </p>
              <div class="form-group">
                <label class="form-label" for="externalDockerImage">
                  <Text id="integration.externalIntegration.installFromGithub.dockerImageLabel" />
                </label>
                <Localizer>
                  <input
                    id="externalDockerImage"
                    type="text"
                    class="form-control"
                    value={dockerImage}
                    onInput={this.updateDockerImage}
                    placeholder={<Text id="integration.externalIntegration.installFromGithub.dockerImagePlaceholder" />}
                  />
                </Localizer>
              </div>
              <div class="form-group">
                <label class="form-label" for="externalManifestJson">
                  <Text id="integration.externalIntegration.installFromGithub.manifestLabel" />
                </label>
                <Localizer>
                  <textarea
                    id="externalManifestJson"
                    class="form-control"
                    rows="6"
                    value={manifestJson}
                    onInput={this.updateManifestJson}
                    placeholder={<Text id="integration.externalIntegration.installFromGithub.manifestPlaceholder" />}
                  />
                </Localizer>
              </div>
              <button
                type="submit"
                class={cx('btn btn-primary', {
                  'btn-loading': installing && devMode
                })}
                disabled={installing || !dockerImage || dockerImage.trim().length === 0}
              >
                <i class="fe fe-download mr-1" />
                <Text id="integration.externalIntegration.installFromGithub.installButton" />
              </button>
            </form>
          )}
        </div>
      </Modal>
    );
  }

  render({ list, button }, state) {
    if (button) {
      return (
        <>
          <button type="button" onClick={this.openModal} class="btn btn-primary">
            <i class="fe fe-github mr-2" />
            <Text id="integration.externalIntegration.installFromGithub.cardTitle" />
          </button>
          {state.modalOpen && this.renderModal(state)}
        </>
      );
    }
    if (list) {
      return (
        <div class="list-group-item">
          <a href="#" onClick={this.openModal} class={style.listLink}>
            <span class={style.listIcon}>
              <i class="fe fe-github" />
            </span>
            <span>
              <span class="font-weight-bold d-block">
                <Text id="integration.externalIntegration.installFromGithub.cardTitle" />
              </span>
              <span class="text-muted small">
                <Text id="integration.externalIntegration.installFromGithub.cardDescription" />
              </span>
            </span>
          </a>
          {state.modalOpen && this.renderModal(state)}
        </div>
      );
    }
    return (
      <div class="col-sm-6 col-lg-4">
        <a href="#" onClick={this.openModal} class={style.cardLink}>
          <div class={`card ${style.installCard}`}>
            <div class="card-body text-center">
              <i class={`fe fe-github ${style.installCardIcon}`} />
              <h4 class="mt-3">
                <Text id="integration.externalIntegration.installFromGithub.cardTitle" />
              </h4>
              <div class="text-muted">
                <Text id="integration.externalIntegration.installFromGithub.cardDescription" />
              </div>
            </div>
          </div>
        </a>
        {state.modalOpen && this.renderModal(state)}
      </div>
    );
  }
}

export default connect('httpClient')(InstallFromGithubCard);
