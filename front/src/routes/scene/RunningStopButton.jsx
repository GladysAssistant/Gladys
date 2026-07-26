import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import { formatElapsed } from './runningInfo';

/**
 * @description Button shown while a scene is running: displays the live status
 * (green "En cours" + elapsed time) and turns into a red "Stop" button on
 * hover/focus. Clicking it stops the scene. Both labels share the same grid
 * cell so the button keeps a constant width.
 */
const RunningStopButton = ({ runningInfo, onStop, small }) => (
  <button
    type="button"
    onClick={onStop}
    class={cx('btn', 'btn-outline-success', style.runningStopButton, { 'btn-sm': small })}
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

export default RunningStopButton;
