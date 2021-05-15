import cx from 'classnames';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/mediaPlayer';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
import { useEffect } from 'preact/hooks';
import get from 'get-value';
import style from './style.css';
import { getDeviceFeature, getDeviceParam } from '../../../../../server/utils/device';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

function detailsFromDevice(device) {
  const source = JSON.parse(
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER, DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE)
      .last_value_string || '{}'
  );
  const power = Boolean(
    get(
      getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER, DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER),
      'last_value',
      false
    )
  );

  return {
    name: device.name,
    playing: source && Object.keys(source).length > 0 && source.label,
    power,
    source
  };
}

const MediaPlayer = connect(
  'session,DashboardBoxDataMediaPlayer,DashboardBoxStatusMediaPlayer',
  actions
)(props => {
  const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}MediaPlayer.${props.x}_${props.y}`);

  useEffect(() => {
    (async () => {
      props.getMediaPlayer(props.box, props.x, props.y);
      props.addListeners();
    })();

    return () => props.removeListeners();
  }, [props.box.player]);

  if (!boxStatus || boxStatus !== RequestStatus.Success) {
    return null;
  }

  const { name, playing, power, source } = detailsFromDevice(
    get(props, `${DASHBOARD_BOX_DATA_KEY}MediaPlayer.${props.x}_${props.y}.device`)
  );

  return (
    <div class="card p-3">
      <div class="d-flex align-items-center">
        <span class={cx('stamp', 'stamp-md', 'mr-3', power && 'bg-blue', style.stamp)}>
          {source.image ? <img src={source.image} /> : <i class="fe fe-power" />}
        </span>
        <div>
          <h4 class="m-0">{name}</h4>

          {playing && (
            <small class="text-muted">
              <Text
                id="dashboard.boxes.mediaPlayer.currentlyWatching"
                fields={{
                  media: source.label
                }}
              />
            </small>
          )}
        </div>
      </div>
    </div>
  );
});

export default MediaPlayer;
