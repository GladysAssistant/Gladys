import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import classNames from 'classnames/bind';
import style from './style.css';
import get from 'get-value';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import config from '../../../../../config';

let cx = classNames.bind(style);

class SetupTab extends Component {
  componentDidMount = () => {
    this.checkStatus();
    this.getConfiguration();
  };

  getConfiguration = async () => {
    try {
      const nodeRedUsernameVariable = await this.props.httpClient.get(
        '/api/v1/service/node-red/variable/NODE_RED_USERNAME'
      );
      const nodeRedPasswordVariable = await this.props.httpClient.get(
        '/api/v1/service/node-red/variable/NODE_RED_PASSWORD'
      );

      const isGladysPlus = this.props.session.gatewayClient !== undefined;
      let nodeRedUrl = null;

      if (isGladysPlus === false) {
        const nodeRedPortVariable = await this.props.httpClient.get('/api/v1/service/node-red/variable/NODE_RED_PORT');

        const url = new URL(config.localApiUrl);
        nodeRedUrl = `${url.protocol}//${url.hostname}:${nodeRedPortVariable.value}`;
      }

      this.setState({
        nodeRedUsername: nodeRedUsernameVariable.value,
        nodeRedPassword: nodeRedPasswordVariable.value,
        nodeRedUrl
      });
    } catch (e) {
      // Variable is not set yet
    }
  };

  async componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE, this.checkStatus);
  }

  componentWillUnmount = () => {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE, this.checkStatus);
    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }
  };

  toggle = () => {
    let checked = this.state.nodeRedEnabled;
    checked = !checked;

    if (checked) {
      this.startContainer();
    } else {
      this.stopContainer();
    }
  };

  startContainer = async () => {
    let error = false;

    this.setState({
      nodeRedStatus: RequestStatus.Getting
    });

    await this.props.httpClient.post('/api/v1/service/node-red/variable/NODERED_ENABLED', {
      value: true
    });

    try {
      await this.props.httpClient.post('/api/v1/service/node-red/connect');
    } catch (e) {
      error = error | get(e, 'response.status');
    }

    if (error) {
      this.setState({
        nodeRedStatus: RequestStatus.Error
      });
    } else {
      this.setState({
        nodeRedStatus: RequestStatus.Success
      });
    }
    await this.getConfiguration();
    await this.checkStatus();
  };

  stopContainer = async () => {
    await this.props.httpClient.post('/api/v1/service/node-red/variable/NODERED_ENABLED', {
      value: false
    });

    let error = false;
    try {
      await this.props.httpClient.post('/api/v1/service/node-red/disconnect');
    } catch (e) {
      error = error | get(e, 'response.status');
    }

    if (error) {
      this.setState({
        nodeRedStatus: RequestStatus.Error
      });
    } else {
      this.setState({
        nodeRedStatus: RequestStatus.Success
      });
    }
    this.setState({ showConfirmDelete: false });
    await this.getConfiguration();
    await this.checkStatus();
  };

  checkStatus = async () => {
    let nodeRedStatus = {
      nodeRedExist: false,
      nodeRedRunning: false,
      nodeRedEnabled: false,
      dockerBased: false,
      networkModeValid: false
    };
    try {
      nodeRedStatus = await this.props.httpClient.get('/api/v1/service/node-red/status');
    } finally {
      this.setState({
        nodeRedExist: nodeRedStatus.nodeRedExist,
        nodeRedRunning: nodeRedStatus.nodeRedRunning,
        nodeRedEnabled: nodeRedStatus.nodeRedEnabled,
        dockerBased: nodeRedStatus.dockerBased,
        networkModeValid: nodeRedStatus.networkModeValid
      });
    }
  };

  togglePassword = () => {
    const { showPassword } = this.state;

    if (this.showPasswordTimer) {
      clearTimeout(this.showPasswordTimer);
      this.showPasswordTimer = null;
    }

    this.setState({ showPassword: !showPassword });

    if (!showPassword) {
      this.showPasswordTimer = setTimeout(() => this.setState({ showPassword: false }), 5000);
    }
  };

  showConfirmDelete = () => {
    this.setState({ showConfirmDelete: true });
  };

  cancelDisable = () => {
    this.setState({ showConfirmDelete: false });
  };

  render(
    props,
    {
      nodeRedEnabled,
      dockerBased,
      networkModeValid,
      nodeRedExist,
      nodeRedRunning,
      nodeRedUsername,
      nodeRedPassword,
      nodeRedUrl,
      nodeRedStatus,
      showPassword,
      showConfirmDelete
    }
  ) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.nodeRed.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <p>
            <MarkupText id="integration.nodeRed.setup.description" />
          </p>

          <div class="d-flex flex-row flex-wrap justify-content-between mr-0 ml-0 alert alert-warning">
            <div class={cx(style.textAlignMiddleContainer)}>
              <span class={cx(style.textAlignMiddle)}>
                <MarkupText id="integration.nodeRed.setup.descriptionBackup" />
              </span>
            </div>
          </div>

          <CheckStatus
            nodeRedEnabled={nodeRedEnabled}
            nodeRedExist={nodeRedExist}
            nodeRedRunning={nodeRedRunning}
            dockerBased={dockerBased}
            networkModeValid={networkModeValid}
            nodeRedStatus={nodeRedStatus}
          />

          {nodeRedRunning && (
            <div>
              <div class="form-group">
                <label htmlFor="nodeRedUsername" className="form-label">
                  <Text id={`integration.nodeRed.setup.usernameLabel`} />
                </label>
                <Localizer>
                  <input
                    id="nodeRedUsername"
                    name="nodeRedUsername"
                    value={nodeRedUsername}
                    className="form-control"
                    disabled={true}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label htmlFor="nodeRedPassword" className="form-label">
                  <Text id={`integration.nodeRed.setup.passwordLabel`} />
                </label>
                <div class="input-icon mb-3">
                  <Localizer>
                    <input
                      id="nodeRedPassword"
                      name="nodeRedPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={nodeRedPassword}
                      className="form-control"
                      disabled={true}
                    />
                  </Localizer>
                  <span class="input-icon-addon cursor-pointer" onClick={this.togglePassword}>
                    <i
                      class={cx('fe', {
                        'fe-eye': !showPassword,
                        'fe-eye-off': showPassword
                      })}
                    />
                  </span>
                </div>
              </div>

              <div class="form-group">
                {nodeRedUrl && (
                  <label htmlFor="nodeRedUrl" className="form-label">
                    <MarkupText
                      id={`integration.nodeRed.setup.urlLabel`}
                      fields={{
                        nodeRedUrl
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {dockerBased && networkModeValid && nodeRedEnabled && !showConfirmDelete && (
            <button
              onClick={this.showConfirmDelete}
              class="btn btn-danger"
              disabled={nodeRedStatus === RequestStatus.Getting}
            >
              <Text id="integration.nodeRed.setup.disableNodeRed" />
            </button>
          )}
          {dockerBased && networkModeValid && !nodeRedEnabled && !showConfirmDelete && (
            <button
              onClick={this.startContainer}
              class="btn btn-primary"
              disabled={nodeRedStatus === RequestStatus.Getting}
            >
              <Text id="integration.nodeRed.setup.enableNodeRed" />
            </button>
          )}
          {dockerBased && networkModeValid && nodeRedEnabled && showConfirmDelete && (
            <div style="row-gap: 1em" class="d-flex justify-content-between align-items-start flex-column">
              <Text id="integration.nodeRed.setup.confirmDisableLabel" />
              <div>
                <button
                  onClick={this.stopContainer}
                  className="btn btn-danger"
                  disabled={nodeRedStatus === RequestStatus.Getting}
                >
                  <Text id="integration.nodeRed.setup.disableNodeRed" />
                </button>
                <button
                  onClick={this.cancelDisable}
                  className="btn ml-2"
                  disabled={nodeRedStatus === RequestStatus.Getting}
                >
                  <Text id="integration.nodeRed.setup.confirmDisableCancelButton" />
                </button>
              </div>
            </div>
          )}
          {nodeRedRunning && (
            <div class="mt-4">
              <div class="card-header d-none d-sm-block">
                <h2 class="card-title">
                  <Text id="integration.nodeRed.setup.serviceStatus" />
                </h2>
              </div>
              <div class="row justify-content-center">
                <div class="col-auto">
                  <table className="table table-responsive table-borderless table-sm d-none d-sm-block">
                    <thead class="text-center">
                      <tr>
                        <th className="text-center">
                          <Text id="integration.nodeRed.setup.gladys" />
                        </th>
                        <th className="text-center" />
                        <th className="text-center">{nodeRedEnabled && 'Node-RED'}</th>
                      </tr>
                    </thead>
                    <tbody class="text-center">
                      <tr>
                        <td className="text-center">
                          <img
                            src="/assets/icons/favicon-96x96.png"
                            alt={`Gladys`}
                            title={`Gladys`}
                            width="80"
                            height="80"
                          />
                        </td>
                        {nodeRedEnabled && (
                          <td className={style.tdCenter}>
                            <hr className={style.line} />
                            <i
                              className={cx('fe', {
                                'fe-check': nodeRedRunning,
                                'fe-x': !nodeRedRunning,
                                greenIcon: nodeRedRunning,
                                redIcon: !nodeRedRunning
                              })}
                            />
                            <hr className={style.line} />
                          </td>
                        )}
                        <td className="text-center">
                          {nodeRedEnabled && (
                            <img
                              src="/assets/integrations/logos/logo_node-red.png"
                              alt={`Node-RED`}
                              title={`Node-RED`}
                              width="80"
                              height="80"
                            />
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center">
                          <div class="tag tag-success">
                            <Text id={`systemSettings.containerState.running`} />
                          </div>
                        </td>
                        <td className="text-center" />
                        <td className="text-center">
                          {nodeRedRunning && (
                            <span class="tag tag-success">
                              <Text id={`systemSettings.containerState.running`} />
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="card-header d-sm-none">
                <h2 class="card-title">
                  <Text id="integration.nodeRed.setup.containersStatus" />
                </h2>
              </div>
              <div class="row justify-content-center d-sm-none">
                <div class="col-auto">
                  <table className="table table-responsive table-borderless table-sm">
                    <thead class="text-center">
                      <tr>
                        <th>
                          <Text id="systemSettings.containers" />
                        </th>
                        <th>
                          <Text id="integration.nodeRed.setup.status" />
                        </th>
                      </tr>
                    </thead>
                    <tbody class="text-center">
                      <tr>
                        <td>
                          <Text id="integration.nodeRed.setup.gladys" />
                        </td>
                        <td>
                          <span class="tag tag-success">
                            <Text id={`systemSettings.containerState.running`} />
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Text id="integration.nodeRed.setup.node-red" />
                        </td>
                        <td>
                          {nodeRedRunning && (
                            <span class="tag tag-success">
                              <Text id={`systemSettings.containerState.running`} />
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default SetupTab;
