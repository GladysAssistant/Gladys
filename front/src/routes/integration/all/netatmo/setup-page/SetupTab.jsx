import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
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
              {console.log(props)}
              {props.accessDenied && (
                <p class="text-center alert alert-warning">
                  <MarkupText id={`integration.netatmo.setup.errorConnecting.${props.messageAlert}`} />
                </p>
              )}
              {!props.accessDenied &&
                ((props.connectNetatmoStatus === STATUS.CONNECTING && (
                  <p class="text-center alert alert-info">
                    <Text id="integration.netatmo.setup.connecting" />
                  </p>
                )) ||
                  (props.connectNetatmoStatus === STATUS.NOT_INITIALIZED && (
                    <p class="text-center alert alert-warning">
                      <Text id="integration.netatmo.setup.notConfigured" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.PROCESSING_TOKEN && (
                    <p class="text-center alert alert-warning">
                      <Text id="integration.netatmo.setup.processingToken" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.CONNECTED && (
                    <p class="text-center alert alert-success">
                      <Text id="integration.netatmo.setup.connect" />
                    </p>
                  )) ||
                  (props.connectNetatmoStatus === STATUS.DISCONNECTED && (
                    <p class="text-center alert alert-danger">
                      <Text id="integration.netatmo.setup.disconnect" />
                    </p>
                  )))}
              <p>
                <MarkupText id="integration.netatmo.setup.description" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateAccount" />
                <MarkupText id="integration.netatmo.setup.descriptionCreateProject" />
                <MarkupText id="integration.netatmo.setup.descriptionGetKeys" />
              </p>
              <p>
                <label htmlFor="titleAdditionalInformation" className="form-label" style={{ fontStyle: 'italic' }}>
                  <MarkupText id="integration.netatmo.setup.descriptionScopeInformation" />
                </label>
              </p>
              <p>
                <label
                  htmlFor="titleAdditionalInformation"
                  className="form-label"
                  style={{
                    textDecoration: 'underline',
                    fontWeight: 'bold'
                  }}
                >
                  <MarkupText id="integration.netatmo.setup.titleAdditionalInformation" />
                </label>
                <MarkupText id="integration.netatmo.setup.descriptionAdditionalInformation" />
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
                {props.notOnGladysGateway && (
                  <div class={style.buttonGroup}>
                    <Localizer>
                      <button
                        type="submit"
                        class={`btn btn-success ${style.btnTextLineSpacing}`}
                        onClick={props.saveConfiguration}
                      >
                        <Text id="integration.netatmo.setup.saveLabel" />
                        <br />
                        {props.connectNetatmoStatus !== STATUS.CONNECTED && (
                          <Text id="integration.netatmo.setup.connectLabel" />
                        )}
                        {props.connectNetatmoStatus === STATUS.CONNECTED && (
                          <Text id="integration.netatmo.setup.reconnectLabel" />
                        )}
                      </button>
                    </Localizer>
                    {props.notOnGladysGateway && props.connectNetatmoStatus === STATUS.CONNECTED && (
                      <button
                        onClick={this.disconnectNetatmo.bind(this)}
                        class={`btn btn-danger ${style.btnTextLineSpacing}`}
                        disabled={props.connectNetatmoStatus === STATUS.DISCONNECTING}
                      >
                        <Text id="integration.netatmo.setup.disconnectLabel" />
                        <br />
                        <Text id="integration.netatmo.setup.disconnectInformationLabel" />
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
