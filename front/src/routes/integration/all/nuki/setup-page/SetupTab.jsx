import { MarkupText, Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

const HIDDEN_API_KEY = '****************';

class SetupTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nukiConnectionStatus: null,
      nukiConnectionError: null,
      nukiConnected: null,
      apiKeyChanges: false,
      nukiApiKey: null
    };
  }
  componentWillMount() {
    this.loadConfiguration();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NUKI.CONNECTED, this.displayConnectedMessage);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NUKI.ERROR, this.displayNukiError);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NUKI.CONNECTED, this.displayConnectedMessage);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NUKI.ERROR, this.displayNukiError);
  }

  loadConfiguration = async () => {
    let configuration = {};
    try {
      configuration = await this.props.httpClient.get('/api/v1/service/nuki/config');
    } finally {
      const key = configuration.apiKey;
      this.setState({
        nukiApiKey: key && `${key.replace(key.substring(3, key.length - 3), HIDDEN_API_KEY)}`,
        apiKeyChanges: false
      });
    }
  };

  updateConfiguration = e => {
    const data = {};
    data[e.target.name] = e.target.value;
    if (e.target.name === 'nukiApiKey') {
      data.apiKeyChanges = true;
    }
    this.setState(data);
  };

  saveConfiguration = async () => {
    event.preventDefault();
    this.setState({
      nukiConnectionStatus: RequestStatus.Getting,
      nukiConnected: false,
      nukiConnectionError: undefined
    });
    try {
      const { nukiApiKey, apiKeyChanges } = this.state;
      await this.props.httpClient.post('/api/v1/service/nuki/config', {
        apiKey: (apiKeyChanges && nukiApiKey) || undefined
      });
      await this.props.httpClient.get(`/api/v1/service/nuki/connect`);

      this.setState({
        nukiConnectionStatus: RequestStatus.Success
      });

      setTimeout(() => this.setState({ nukiConnectionStatus: undefined }), 3000);
    } catch (e) {
      this.setState({
        nukiConnectionStatus: RequestStatus.Error,
        apiKeyChanges: false
      });
    }
  };

  displayConnectedMessage = () => {
    // display 3 seconds a message "Nuki connected"
    this.setState({
      nukiConnected: true,
      nukiConnectionError: undefined
    });
    setTimeout(
      () =>
        this.setState({
          nukiConnected: false,
          nukiConnectionStatus: undefined
        }),
      3000
    );
  };

  displayNukiError = error => {
    this.setState({
      nukiConnected: false,
      nukiConnectionStatus: undefined,
      nukiConnectionError: error
    });
  };

  render() {
    const { nukiConnectionStatus, nukiConnectionError, nukiConnected, nukiApiKey } = this.state;
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.nuki.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: nukiConnectionStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="alert alert-info">
                <MarkupText id="integration.nuki.setup.nukiDescription" />
              </div>

              {nukiConnectionStatus === RequestStatus.Error && !nukiConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.nuki.setup.error" />
                </p>
              )}
              {nukiConnectionStatus === RequestStatus.Success && !nukiConnected && (
                <p class="alert alert-info">
                  <Text id="integration.nuki.setup.connecting" />
                </p>
              )}
              {nukiConnected && (
                <p class="alert alert-success">
                  <Text id="integration.nuki.setup.connected" />
                </p>
              )}
              {nukiConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.nuki.setup.connectionError" />
                </p>
              )}

              <form id="nukiSetupForm">
                <div class="form-group">
                  <label for="nukiApiKey" class="form-label">
                    <Text id={`integration.nuki.setup.apiKeyLabel`} />
                  </label>
                  <Localizer>
                    <input
                      name="nukiApiKey"
                      placeholder={<Text id="integration.nuki.setup.apiKeyPlaceholder" />}
                      value={nukiApiKey}
                      class="form-control"
                      onInput={this.updateConfiguration}
                    />
                  </Localizer>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={this.saveConfiguration}>
                      <Text id="integration.nuki.setup.saveLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(SetupTab);
