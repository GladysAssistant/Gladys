import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import cx from 'classnames';
import style from './style.css';
import RunningStopButton from '../../../routes/scene/RunningStopButton';

class SceneRow extends Component {
  startScene = async () => {
    // Prevent launching a new instance while the scene is already running
    if (this.props.runningInfo) {
      return;
    }
    try {
      await this.setState({ loading: true });
      await this.props.httpClient.post(`/api/v1/scene/${this.props.sceneSelector}/start`);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => this.setState({ loading: false }), 500);
  };

  stopScene = async () => {
    try {
      await this.props.httpClient.post(`/api/v1/scene/${this.props.sceneSelector}/stop`);
    } catch (e) {
      console.error(e);
    }
  };

  render({ children, ...props }, { loading }) {
    return (
      <tr>
        <td>
          <i className={`fe fe-${props.icon}`} />
        </td>
        <td>{props.name}</td>
        <td className="text-right">
          {props.runningInfo ? (
            <RunningStopButton runningInfo={props.runningInfo} onStop={this.stopScene} small />
          ) : (
            <button
              onClick={this.startScene}
              type="button"
              class={cx('btn', 'btn-outline-success', 'btn-sm', style.btnLoading, {
                'btn-loading': loading
              })}
              disabled={loading}
            >
              <i class="fe fe-play" />
              <Text id="scene.startButton" />
            </button>
          )}
        </td>
      </tr>
    );
  }
}
export default connect('httpClient', {})(SceneRow);
