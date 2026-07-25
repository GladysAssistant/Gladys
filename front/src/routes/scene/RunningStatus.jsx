import { Text } from 'preact-i18n';
import style from './style.css';
import { formatElapsed } from './runningInfo';

/**
 * @description Inline "running" indicator meant to be used as the content of the
 * start button while a scene is executing: a pulsing dot, an optional instance
 * count and the live elapsed time.
 */
const RunningStatus = ({ runningInfo }) => {
  if (!runningInfo) {
    return null;
  }
  return (
    <span class={style.runningStatus}>
      <span class={style.runningDot} />
      {runningInfo.count > 1 && <span class="mr-1">{runningInfo.count}×</span>}
      <Text id="scene.running" /> {formatElapsed(runningInfo.elapsedMs)}
    </span>
  );
};

export default RunningStatus;
