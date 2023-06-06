import cx from 'classnames';
import DeviceRow from './DeviceRow';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

const hasSwitchFeature = (device, featureSelectors) => {
  return device.features.find(feature => isSwitchFeature(feature, featureSelectors));
};

const isSwitchFeature = (feature, featureSelectors) => {
  return (
    feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
    feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
    feature.read_only === false &&
    featureSelectors.includes(feature.selector)
  );
};

const changeAllLightsStatusRoom = (props, roomLightStatus) => () => {
  const newStatus = roomLightStatus === 1 ? 0 : 1;
  props.changeAllLightsStatusRoom(props.x, props.y, newStatus);
};

const DeviceCard = ({ children, ...props }) => {
  const { boxTitle, roomLightStatus, loading, devices = [], box = {} } = props;
  const { device_features: featureSelectors = [] } = box;

  const hasBinaryLightDeviceFeature = devices.find(device => hasSwitchFeature(device, featureSelectors)) !== undefined;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{boxTitle}</h3>
        {hasBinaryLightDeviceFeature && (
          <div class="card-options">
            <label class="custom-switch m-0">
              <input
                type="checkbox"
                name={props.boxTitle}
                value="1"
                class="custom-switch-input"
                checked={roomLightStatus === 1}
                onClick={changeAllLightsStatusRoom(props, roomLightStatus)}
              />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        )}
      </div>
      <div
        class={cx('dimmer', {
          active: loading
        })}
      >
        <div class="loader py-3" />
        <div class="dimmer-content">
          <div class="table-responsive">
            <table class="table card-table table-vcenter">
              <tbody>
                {devices.map((device, deviceIndex) =>
                  device.features.map(
                    (deviceFeature, deviceFeatureIndex) =>
                      featureSelectors.indexOf(deviceFeature.selector) !== -1 && (
                        <DeviceRow
                          user={props.user}
                          x={props.x}
                          y={props.y}
                          device={device}
                          deviceFeature={deviceFeature}
                          roomIndex={props.roomIndex}
                          deviceIndex={deviceIndex}
                          deviceFeatureIndex={deviceFeatureIndex}
                          updateValue={props.updateValue}
                          updateValueWithDebounce={props.updateValueWithDebounce}
                        />
                      )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
