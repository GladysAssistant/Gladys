import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
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
  };

  async componentWillMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE, this.checkStatus);
  }

  componentWillUnmount = () => {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE, this.checkStatus);
  };

  toggle = () => {
    let checked = this.state.matterbridgeEnabled;
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
      matterbridgeStatus: RequestStatus.Getting
    });

    await this.props.httpClient.post('/api/v1/service/matterbridge/variable/MATTERBRIDGE_ENABLED', {
      value: true
    });

    try {
      await this.props.httpClient.post('/api/v1/service/matterbridge/connect');
    } catch (e) {
      error = error | get(e, 'response.status');
    }

    if (error) {
      this.setState({
        matterbridgeStatus: RequestStatus.Error
      });
    } else {
      this.setState({
        matterbridgeStatus: RequestStatus.Success
      });
    }
    await this.checkStatus();
  };

  stopContainer = async () => {
    await this.props.httpClient.post('/api/v1/service/matterbridge/variable/MATTERBRIDGE_ENABLED', {
      value: false
    });

    let error = false;
    try {
      await this.props.httpClient.post('/api/v1/service/matterbridge/disconnect');
    } catch (e) {
      error = error | get(e, 'response.status');
    }

    if (error) {
      this.setState({
        matterbridgeStatus: RequestStatus.Error
      });
    } else {
      this.setState({
        matterbridgeStatus: RequestStatus.Success
      });
    }
    this.setState({ showConfirmDelete: false });
    await this.checkStatus();
  };

  checkStatus = async () => {
    let matterbridgeStatus = {
      matterbridgeExist: false,
      matterbridgeRunning: false,
      matterbridgeEnabled: false,
      dockerBased: false,
      networkModeValid: false
    };
    try {
      matterbridgeStatus = await this.props.httpClient.get('/api/v1/service/matterbridge/status');
    } finally {
      const isGladysPlus = this.props.session.gatewayClient !== undefined;
      let matterbridgeUrl = null;

      if (isGladysPlus === false && matterbridgeStatus.matterbridgeRunning) {
        try {
          const matterbridgePortVariable = await this.props.httpClient.get(
            '/api/v1/service/matterbridge/variable/MATTERBRIDGE_PORT'
          );
          const url = new URL(config.localApiUrl);
          matterbridgeUrl = `${url.protocol}//${url.hostname}:${matterbridgePortVariable.value}`;
        } catch (e) {
          // Variable not set yet
        }
      }

      this.setState({
        matterbridgeExist: matterbridgeStatus.matterbridgeExist,
        matterbridgeRunning: matterbridgeStatus.matterbridgeRunning,
        matterbridgeEnabled: matterbridgeStatus.matterbridgeEnabled,
        dockerBased: matterbridgeStatus.dockerBased,
        networkModeValid: matterbridgeStatus.networkModeValid,
        matterbridgeUrl
      });
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
      matterbridgeEnabled,
      dockerBased,
      networkModeValid,
      matterbridgeExist,
      matterbridgeRunning,
      matterbridgeUrl,
      matterbridgeStatus,
      showConfirmDelete
    }
  ) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.matterbridge.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <p>
            <MarkupText id="integration.matterbridge.setup.description" />
          </p>

          <CheckStatus
            matterbridgeEnabled={matterbridgeEnabled}
            matterbridgeExist={matterbridgeExist}
            matterbridgeRunning={matterbridgeRunning}
            dockerBased={dockerBased}
            networkModeValid={networkModeValid}
            matterbridgeStatus={matterbridgeStatus}
          />

          {matterbridgeRunning && matterbridgeUrl && (
            <div>
              <div class="form-group">
                <label htmlFor="matterbridgeUrl" className="form-label">
                  <MarkupText
                    id={`integration.matterbridge.setup.urlLabel`}
                    fields={{
                      matterbridgeUrl
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {dockerBased && networkModeValid && matterbridgeEnabled && !showConfirmDelete && (
            <button
              onClick={this.showConfirmDelete}
              class="btn btn-danger"
              disabled={matterbridgeStatus === RequestStatus.Getting}
            >
              <Text id="integration.matterbridge.setup.disableMatterbridge" />
            </button>
          )}
          {dockerBased && networkModeValid && !matterbridgeEnabled && !showConfirmDelete && (
            <button
              onClick={this.startContainer}
              class="btn btn-primary"
              disabled={matterbridgeStatus === RequestStatus.Getting}
            >
              <Text id="integration.matterbridge.setup.enableMatterbridge" />
            </button>
          )}
          {dockerBased && networkModeValid && matterbridgeEnabled && showConfirmDelete && (
            <div style="row-gap: 1em" class="d-flex justify-content-between align-items-start flex-column">
              <Text id="integration.matterbridge.setup.confirmDisableLabel" />
              <div>
                <button
                  onClick={this.stopContainer}
                  className="btn btn-danger"
                  disabled={matterbridgeStatus === RequestStatus.Getting}
                >
                  <Text id="integration.matterbridge.setup.disableMatterbridge" />
                </button>
                <button
                  onClick={this.cancelDisable}
                  className="btn ml-2"
                  disabled={matterbridgeStatus === RequestStatus.Getting}
                >
                  <Text id="integration.matterbridge.setup.confirmDisableCancelButton" />
                </button>
              </div>
            </div>
          )}
          {matterbridgeRunning && (
            <div class="mt-4">
              <div class="card-header d-none d-sm-block">
                <h2 class="card-title">
                  <Text id="integration.matterbridge.setup.serviceStatus" />
                </h2>
              </div>
              <div class="row justify-content-center">
                <div class="col-auto">
                  <table className="table table-responsive table-borderless table-sm d-none d-sm-block">
                    <thead class="text-center">
                      <tr>
                        <th className="text-center">
                          <Text id="integration.matterbridge.setup.gladys" />
                        </th>
                        <th className="text-center" />
                        <th className="text-center">{matterbridgeEnabled && 'Matterbridge'}</th>
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
                        {matterbridgeEnabled && (
                          <td className={style.tdCenter}>
                            <hr className={style.line} />
                            <i
                              className={cx('fe', {
                                'fe-check': matterbridgeRunning,
                                'fe-x': !matterbridgeRunning,
                                greenIcon: matterbridgeRunning,
                                redIcon: !matterbridgeRunning
                              })}
                            />
                            <hr className={style.line} />
                          </td>
                        )}
                        <td className="text-center">
                          {matterbridgeEnabled && (
                            <img
                              src="/assets/integrations/logos/logo_matterbridge.png"
                              alt={`Matterbridge`}
                              title={`Matterbridge`}
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
                          {matterbridgeRunning && (
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
                  <Text id="integration.matterbridge.setup.containersStatus" />
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
                          <Text id="integration.matterbridge.setup.status" />
                        </th>
                      </tr>
                    </thead>
                    <tbody class="text-center">
                      <tr>
                        <td>
                          <Text id="integration.matterbridge.setup.gladys" />
                        </td>
                        <td>
                          <span class="tag tag-success">
                            <Text id={`systemSettings.containerState.running`} />
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <Text id="integration.matterbridge.setup.matterbridge" />
                        </td>
                        <td>
                          {matterbridgeRunning && (
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
