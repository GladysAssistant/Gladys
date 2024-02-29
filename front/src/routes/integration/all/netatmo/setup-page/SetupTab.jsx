import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import { STATUS } from '../../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  showClientSecretTimer = null;
  async disconnectNetatmo(e) {
    e.preventDefault();

    await this.setState({
      netatmoDisconnectStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/netatmo/disconnect');
      this.props.updateStateInIndex({ connectNetatmoStatus: STATUS.DISCONNECTED });
      await this.setState({
        netatmoDisconnectStatus: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        netatmoSaveSettingsStatus: RequestStatus.Error
      });
    }
  }
  updateClientId = e => {
    this.props.updateStateInIndex({ netatmoClientId: e.target.value });
  };
  updateClientSecret = e => {
    this.props.updateStateInIndex({ netatmoClientSecret: e.target.value });
  };
  updateEnergyApi = () => {
    if (this.props.netatmoEnergyApi === true) {
      this.props.updateStateInIndex({ netatmoEnergyApi: false });
    } else {
      this.props.updateStateInIndex({ netatmoEnergyApi: true });
    }
  };
  updateWeatherApi = () => {
    if (this.props.netatmoWeatherApi === true) {
      this.props.updateStateInIndex({ netatmoWeatherApi: false });
    } else {
      this.props.updateStateInIndex({ netatmoWeatherApi: true });
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
            <Text id="integration.netatmo.setup.title" />
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
                <MarkupText id="integration.netatmo.setup.description" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateAccount" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateProject" />
                <MarkupText id="integration.netatmo.setup.descriptionGetKeys" />
              </p>
              <p>
                <label htmlFor="descriptionScopeInformation" className={`form-label ${style.italicText}`}>
                  <MarkupText id="integration.netatmo.setup.descriptionScopeInformation" />
                </label>
              </p>
              <p>
                <label htmlFor="titleAdditionalInformationEnergyApi" className={`form-label ${style.highlightText}`}>
                  <MarkupText id="integration.netatmo.setup.titleAdditionalInformationEnergyApi" />
                </label>
                <MarkupText id="integration.netatmo.setup.descriptionAdditionalInformationEnergyApi" />
              </p>
              <p>
                <label htmlFor="titleAdditionalInformationWeatherApi" className={`form-label ${style.highlightText}`}>
                  <MarkupText id="integration.netatmo.setup.titleAdditionalInformationWeatherApi" />
                </label>
                <MarkupText id="integration.netatmo.setup.descriptionAdditionalInformationWeatherApi" />
              </p>

              <form>
                <div class="form-group">
                  <label htmlFor="netatmoClientId" className="form-label">
                    <Text id={`integration.netatmo.setup.clientIdLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="netatmoClientId"
                      type="text"
                      placeholder={<Text id="integration.netatmo.setup.clientIdPlaceholder" />}
                      value={props.netatmoClientId}
                      className="form-control"
                      autocomplete="off"
                      onInput={this.updateClientId}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="netatmoClientSecret" className="form-label">
                    <Text id={`integration.netatmo.setup.clientSecretLabel`} />
                  </label>
                  <div class="input-icon mb-3">
                    <Localizer>
                      <input
                        id="netatmoClientSecret"
                        name="netatmoClientSecret"
                        type={state.showClientSecret ? 'text' : 'password'}
                        placeholder={<Text id="integration.netatmo.setup.clientSecretPlaceholder" />}
                        value={props.netatmoClientSecret}
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
                  <label class="netatmoEnergyApi" className="form-label">
                    <input
                      type="checkbox"
                      name="netatmoEnergyApi"
                      class="custom-switch-input"
                      checked={props.netatmoEnergyApi}
                      onClick={this.updateEnergyApi}
                    />
                    <span className={`custom-switch-indicator ${style.customSwitchIndicator}`} />
                    <Text id={`integration.netatmo.setup.energyApiLabel`} />
                  </label>
                </div>

                <div class="form-group">
                  <label class="netatmoWeatherApi" className="form-label">
                    <input
                      type="checkbox"
                      name="netatmoWeatherApi"
                      class="custom-switch-input"
                      checked={props.netatmoWeatherApi}
                      onClick={this.updateWeatherApi}
                    />
                    <span className={`custom-switch-indicator ${style.customSwitchIndicator}`} />
                    <Text id={`integration.netatmo.setup.weatherApiLabel`} />
                  </label>
                </div>

                <div class="form-group">
                  <label htmlFor="netatmoSetupConnectionInfo" className="form-label">
                    <Text id="integration.netatmo.setup.connectionInfoLabel" />
                  </label>
                </div>
                {props.notOnGladysGateway && (
                  <div class={style.buttonGroup}>
                    <Localizer>
                      <button type="submit" class={`btn btn-success`} onClick={props.saveConfiguration}>
                        <Text id="integration.netatmo.setup.saveLabel" />
                      </button>
                    </Localizer>
                    {props.notOnGladysGateway && props.connected && (
                      <button
                        onClick={this.disconnectNetatmo.bind(this)}
                        class={`btn btn-danger`}
                        disabled={props.connectNetatmoStatus === STATUS.DISCONNECTING}
                      >
                        <Text id="integration.netatmo.setup.disconnectLabel" />
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
