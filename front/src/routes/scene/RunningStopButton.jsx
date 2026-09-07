import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import { formatElapsed } from './runningInfo';

const supportsHover = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

const DISARM_DELAY_MS = 4000;

/**
 * @description Button shown while a scene is running: displays the live status
 * and elapsed time, and turns into a red "Stop" button on hover/focus. Without
 * hover, the first tap reveals "Stop" and the second one stops the scene.
 */
class RunningStopButton extends Component {
  state = {
    armed: false
  };

  componentWillUnmount() {
    clearTimeout(this.disarmTimer);
  }

  handleClick = e => {
    if (supportsHover() || this.state.armed) {
      clearTimeout(this.disarmTimer);
      this.setState({ armed: false });
      this.props.onStop(e);
      return;
    }
    this.setState({ armed: true });
    this.disarmTimer = setTimeout(() => this.setState({ armed: false }), DISARM_DELAY_MS);
  };

  render({ runningInfo, small }, { armed }) {
    return (
      <button
        type="button"
        onClick={this.handleClick}
        aria-pressed={armed}
        class={cx('btn', 'btn-outline-success', style.runningStopButton, {
          'btn-sm': small,
          [style.armed]: armed
        })}
      >
        <span class={style.swap}>
          <span class={style.runningContent}>
            {runningInfo.count > 1 && <span class="mr-1">{runningInfo.count}×</span>}
            <Text id="scene.running" /> {formatElapsed(runningInfo.elapsedMs)}
          </span>
          <span class={style.stopContent}>
            <span class={style.stopIcon} /> <Text id="scene.stopButton" />
          </span>
        </span>
      </button>
    );
  }
}

export default RunningStopButton;
