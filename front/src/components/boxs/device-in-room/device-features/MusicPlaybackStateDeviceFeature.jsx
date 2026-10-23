import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { MUSIC_PLAYBACK_STATE } from '../../../../../../server/utils/constants';

// A writable playback_state as a play/pause switch. The feature is a four-value enum
// (paused 0, playing 1, idle 2, buffering 3): only PLAYING reads as "on", so a stopped or
// buffering player never shows as playing, and a tap writes 1 (play) from any other state,
// 0 (pause) while playing. A plain on/off switch would treat 2 and 3 as on.
const MusicPlaybackStateDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const isPlaying = Number(deviceFeature.last_value) === MUSIC_PLAYBACK_STATE.PLAYING;
  const targetValue = isPlaying ? MUSIC_PLAYBACK_STATE.PAUSED : MUSIC_PLAYBACK_STATE.PLAYING;

  function updateValue() {
    props.updateValue(deviceFeature, targetValue);
  }

  // same coarse-pointer whole-row affordance as the binary rows
  function updateValueFromRowTap() {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      updateValue();
    }
  }

  return (
    <tr class="device-row-tappable" onClick={updateValueFromRowTap}>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'play' })}`} />
      </td>
      <td>{props.rowName}</td>
      <td class="text-right">
        <label class="custom-switch" onClick={event => event.stopPropagation()}>
          <input
            type="radio"
            name={`box-${props.x}-${props.y}-${deviceFeature.id}`}
            value="1"
            class="custom-switch-input"
            aria-label={props.rowName}
            checked={isPlaying}
            onClick={updateValue}
          />
          <span class="custom-switch-indicator" />
        </label>
      </td>
    </tr>
  );
};

export default MusicPlaybackStateDeviceFeature;
