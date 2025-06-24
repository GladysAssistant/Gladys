import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import StateConnection from './StateConnection';
import { RequestStatus } from '../../../../../utils/consts';
import { STATUS } from '../../../../../../../server/services/tessie/lib/utils/tessie.constants';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  showApiKeyTimer = null;

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

  updateApiKey = e => {
    this.props.updateStateInIndex({ tessieApiKey: e.target.value });
  };

  updateWebsocketEnabled = e => {
    this.props.updateStateInIndex({ tessieWebsocketEnabled: e.target.checked });
  };

  toggleApiKey = () => {
    const { showApiKey } = this.state;

    if (this.showApiKeyTimer) {
      clearTimeout(this.showApiKeyTimer);
      this.showApiKeyTimer = null;
    }

    this.setState({ showApiKey: !showApiKey });

    if (!showApiKey) {
      this.showApiKeyTimer = setTimeout(() => this.setState({ showApiKey: false }), 5000);
    }
  };

  componentWillUnmount() {
    if (this.showApiKeyTimer) {
      clearTimeout(this.showApiKeyTimer);
      this.showApiKeyTimer = null;
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
                <MarkupText id="integration.tessie.setup.descriptionGetApiKey" />
              </p>

              <form>
                <div class="form-group">
                  <label htmlFor="tessieApiKey" className="form-label">
                    <Text id={`integration.tessie.setup.apiKeyLabel`} />
                  </label>
                  <div class="input-icon mb-3">
                    <Localizer>
                      <input
                        id="tessieApiKey"
                        name="tessieApiKey"
                        type={state.showApiKey ? 'text' : 'password'}
                        placeholder={<Text id="integration.tessie.setup.apiKeyPlaceholder" />}
                        value={props.tessieApiKey}
                        className="form-control"
                        autocomplete="off"
                        onInput={this.updateApiKey}
                      />
                    </Localizer>
                    <span class="input-icon-addon cursor-pointer" onClick={this.toggleApiKey}>
                      <i
                        class={cx('fe', {
                          'fe-eye': !state.showApiKey,
                          'fe-eye-off': state.showApiKey
                        })}
                      />
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label htmlFor="tessieWebsocketEnabled" className="form-label">
                    <Text id="integration.tessie.setup.websocketLabel" />
                  </label>
                  <div class="form-check form-switch">
                    <input
                      id="tessieWebsocketEnabled"
                      name="tessieWebsocketEnabled"
                      type="checkbox"
                      className="form-check-input"
                      checked={props.tessieWebsocketEnabled}
                      onChange={this.updateWebsocketEnabled}
                    />
                    <label className="form-check-label" htmlFor="tessieWebsocketEnabled">
                      <Text id="integration.tessie.setup.websocketDescription" />
                    </label>
                  </div>
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
