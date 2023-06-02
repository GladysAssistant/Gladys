import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';
import CheckStatus from './CheckStatus.js';
import classNames from 'classnames/bind';
import style from './style.css';

let cx = classNames.bind(style);

class SetupTab extends Component {
  toggle = () => {
    let checked = this.props.nodeRedEnabled;
    checked = !checked;

    if (checked) {
      this.props.startContainer();
    } else {
      this.props.stopContainer();
    }

    this.props.nodeRedEnabled = checked;
  };

  render(props, {}) {
    console.log(props);
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.node-red.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <p>
            <MarkupText id="integration.node-red.setup.description" />
          </p>
          {props.nodeRedStatus === RequestStatus.Error && (
            <p class="alert alert-danger">
              <Text id="integration.node-red.setup.error" />
            </p>
          )}

          <CheckStatus />

          <div class="form-group">
            <label htmlFor="enableNodeRed" className="form-label">
              <Text id={`integration.node-red.setup.enableLabel`}/>
            </label>
            <label className="custom-switch">
              <input
                type="checkbox"
                id="enableNodeRed"
                name="enableNodeRed"
                className="custom-switch-input"
                checked={props.nodeRedEnabled}
                onClick={this.toggle}
                disabled={!props.dockerBased || !props.networkModeValid}
              />
              <span class="custom-switch-indicator"/>
              <span class="custom-switch-description">
                {!props.dockerBased && <Text id="integration.node-red.setup.nonDockerEnv"/>}
                {props.dockerBased && !props.networkModeValid && (
                  <Text id="integration.node-red.setup.invalidDockerNetwork"/>
                )}
                {props.dockerBased && props.networkModeValid && (
                  <Text id="integration.node-red.setup.enableNodeRed"/>
                )}
              </span>
            </label>
          </div>
          <div class="card-header d-none d-sm-block">
            <h2 class="card-title">
              <Text id="integration.node-red.setup.serviceStatus" />
            </h2>
          </div>
          <div class="row justify-content-center">
            <div class="col-auto">
              <table className="table table-responsive table-borderless table-sm d-none d-sm-block">
                <thead class="text-center">
                <tr>
                  <th className="text-center">
                    <Text id="integration.node-red.setup.gladys"/>
                  </th>
                  <th className="text-center"/>
                  <th className="text-center">{props.nodeRedEnabled && 'Node-red'}</th>
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
                  {props.nodeRedEnabled && (
                    <td className={style.tdCenter}>
                      <hr className={style.line}/>
                      <i
                        className={cx('fe', {
                          'fe-check': props.nodeRedRunning,
                          'fe-x': !props.nodeRedRunning,
                          greenIcon: props.nodeRedRunning,
                          redIcon: !props.nodeRedRunning
                        })}
                      />
                      <hr className={style.line}/>
                    </td>
                  )}
                  <td className="text-center">
                    {props.nodeRedEnabled && (
                      <img
                        src="/assets/integrations/logos/logo_node-red.png"
                        alt={`Node-red`}
                        title={`Node-red`}
                        width="80"
                        height="80"
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="text-center">
                    <div class="tag tag-success">
                      <Text id={`systemSettings.containerState.running`}/>
                    </div>
                  </td>
                  <td className="text-center"/>
                  <td className="text-center">
                    {props.nodeRedRunning && (
                      <span class="tag tag-success">
                          <Text id={`systemSettings.containerState.running`}/>
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
              <Text id="integration.node-red.setup.containersStatus"/>
            </h2>
          </div>
          <div class="row justify-content-center d-sm-none">
            <div class="col-auto">
              <table className="table table-responsive table-borderless table-sm">
                <thead class="text-center">
                <tr>
                  <th>
                    <Text id="systemSettings.containers"/>
                  </th>
                  <th>
                    <Text id="integration.node-red.setup.status"/>
                  </th>
                </tr>
                </thead>
                <tbody class="text-center">
                <tr>
                  <td>
                    <Text id="integration.node-red.setup.gladys"/>
                  </td>
                  <td>
                      <span class="tag tag-success">
                        <Text id={`systemSettings.containerState.running`}/>
                      </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Text id="integration.node-red.setup.node-red"/>
                  </td>
                  <td>
                    {props.nodeRedRunning && (
                      <span class="tag tag-success">
                          <Text id={`systemSettings.containerState.running`}/>
                        </span>
                    )}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
