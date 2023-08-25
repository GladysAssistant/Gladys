import cx from 'classnames';
import DeviceRow from './DeviceRow';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

const hasSwitchFeature = (features, featureSelectors) => {
  return features.find(feature => isSwitchFeature(feature, featureSelectors));
};

const isSwitchFeature = (feature, featureSelectors) => {
  return (
    feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
    feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
    feature.read_only === false &&
    featureSelectors.includes(feature.selector)
  );
};

const DeviceCard = ({ children, ...props }) => {
  const { boxTitle, roomLightStatus, loading, deviceFeatures = [], box = {} } = props;
  const { device_features: featureSelectors = [] } = box;

  const hasBinaryLightDeviceFeature = hasSwitchFeature(deviceFeatures, featureSelectors) !== undefined;

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
                onClick={props.changeAllLightsStatusRoom}
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
                {deviceFeatures.map((deviceFeature, deviceFeatureIndex) => (
                  <DeviceRow
                    user={props.user}
                    x={props.x}
                    y={props.y}
                    device={deviceFeature.device}
                    deviceFeature={deviceFeature}
                    roomIndex={props.roomIndex}
                    deviceFeatureIndex={deviceFeatureIndex}
                    updateValue={props.updateValue}
                    updateValueWithDebounce={props.updateValueWithDebounce}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
