import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import { STATUS } from '../../../../../../../server/services/tessie/lib/utils/tessie.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  showClientSecretTimer = null;
  async disconnectTessie(e) {
    e.preventDefault();

    await this.setState({
      tessieDisconnectStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/tessie/disconnect');
      this.props.updateStateInIndex({ connectTessieStatus: STATUS.DISCONNECTED });
      await this.setState({
        tessieDisconnectStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        tessieSaveSettingsStatus: RequestStatus.Error
      });
    }
  }
  updateClientId = e => {
    this.props.updateStateInIndex({ tessieClientId: e.target.value });
  };
  updateClientSecret = e => {
    this.props.updateStateInIndex({ tessieClientSecret: e.target.value });
  };
  updateEnergyApi = () => {
    if (this.props.tessieEnergyApi === true) {
      this.props.updateStateInIndex({ tessieEnergyApi: false });
    } else {
      this.props.updateStateInIndex({ tessieEnergyApi: true });
    }
  };
  updateWeatherApi = () => {
    if (this.props.tessieWeatherApi === true) {
      this.props.updateStateInIndex({ tessieWeatherApi: false });
    } else {
      this.props.updateStateInIndex({ tessieWeatherApi: true });
    }
  };
  toggleClientSecret = () => {
    const { showClientSecret } = this.state;

    if (this.showClientSecretTimer) {
      clearTimeout(this.showClientSecretTimer);
      this.showClientSecretTimer = null;
    }

    this.setState({ showClientSecret: !showClientSecret });

    if (!showClientSecret) {
      this.showClientSecretTimer = setTimeout(() => this.setState({ showClientSecret: false }), 5000);
    }
  };

  componentWillUnmount() {
    if (this.showClientSecretTimer) {
      clearTimeout(this.showClientSecretTimer);
      this.showClientSecretTimer = null;
    }
  }

  render(props, state, { loading }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tessie.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <StateConnection {...props} />
              <p>
                <MarkupText id="integration.tessie.setup.description" />
                <MarkupText id="integration.tessie.setup.descriptionCreateAccount" />
                <MarkupText id="integration.tessie.setup.descriptionCreateProject" />
                <MarkupText id="integration.tessie.setup.descriptionGetKeys" />
              </p>
              <p>
                <label htmlFor="descriptionScopeInformation" className={`form-label ${style.italicText}`}>
                  <MarkupText id="integration.tessie.setup.descriptionScopeInformation" />
                </label>
              </p>
              <p>
                <label htmlFor="titleAdditionalInformationEnergyApi" className={`form-label ${style.highlightText}`}>
                  <MarkupText id="integration.tessie.setup.titleAdditionalInformationEnergyApi" />
                </label>
                <MarkupText id="integration.tessie.setup.descriptionAdditionalInformationEnergyApi" />
              </p>
              <p>
                <label htmlFor="titleAdditionalInformationWeatherApi" className={`form-label ${style.highlightText}`}>
                  <MarkupText id="integration.tessie.setup.titleAdditionalInformationWeatherApi" />
                </label>
                <MarkupText id="integration.tessie.setup.descriptionAdditionalInformationWeatherApi" />
              </p>

              <form>
                <div class="form-group">
                  <label htmlFor="tessieClientId" className="form-label">
                    <Text id={`integration.tessie.setup.clientIdLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="tessieClientId"
                      type="text"
                      placeholder={<Text id="integration.tessie.setup.clientIdPlaceholder" />}
                      value={props.tessieClientId}
                      className="form-control"
                      autocomplete="off"
                      onInput={this.updateClientId}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="tessieClientSecret" className="form-label">
                    <Text id={`integration.tessie.setup.clientSecretLabel`} />
                  </label>
                  <div class="input-icon mb-3">
                    <Localizer>
                      <input
                        id="tessieClientSecret"
                        name="tessieClientSecret"
                        type={state.showClientSecret ? 'text' : 'password'}
                        placeholder={<Text id="integration.tessie.setup.clientSecretPlaceholder" />}
                        value={props.tessieClientSecret}
                        className="form-control"
                        autocomplete="off"
                        onInput={this.updateClientSecret}
                      />
                    </Localizer>
                    <span class="input-icon-addon cursor-pointer" onClick={this.toggleClientSecret}>
                      <i
                        class={cx('fe', {
                          'fe-eye': !state.showClientSecret,
                          'fe-eye-off': state.showClientSecret
                        })}
                      />
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label class="tessieEnergyApi" className="form-label">
                    <input
                      type="checkbox"
                      name="tessieEnergyApi"
                      class="custom-switch-input"
                      checked={props.tessieEnergyApi}
                      onClick={this.updateEnergyApi}
                    />
                    <span className={`custom-switch-indicator ${style.customSwitchIndicator}`} />
                    <Text id={`integration.tessie.setup.energyApiLabel`} />
                  </label>
                </div>

                <div class="form-group">
                  <label class="tessieWeatherApi" className="form-label">
                    <input
                      type="checkbox"
                      name="tessieWeatherApi"
                      class="custom-switch-input"
                      checked={props.tessieWeatherApi}
                      onClick={this.updateWeatherApi}
                    />
                    <span className={`custom-switch-indicator ${style.customSwitchIndicator}`} />
                    <Text id={`integration.tessie.setup.weatherApiLabel`} />
                  </label>
                </div>

                <div class="form-group">
                  <label htmlFor="tessieSetupConnectionInfo" className="form-label">
                    <Text id="integration.tessie.setup.connectionInfoLabel" />
                  </label>
                </div>
                {props.notOnGladysGateway && (
                  <div class={style.buttonGroup}>
                    <Localizer>
                      <button type="submit" class={`btn btn-success`} onClick={props.saveConfiguration}>
                        <Text id="integration.tessie.setup.saveLabel" />
                      </button>
                    </Localizer>
                    {props.notOnGladysGateway && props.connected && (
                      <button
                        onClick={this.disconnectTessie.bind(this)}
                        class={`btn btn-danger`}
                        disabled={props.connectTessieStatus === STATUS.DISCONNECTING}
                      >
                        <Text id="integration.tessie.setup.disconnectLabel" />
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient', {})(SetupTab);
