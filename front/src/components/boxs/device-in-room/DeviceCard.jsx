import DeviceRow from './DeviceRow';
import style from './style.css';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

const countLightBinaryFeature = (features, featureSelectors) => {
  return features.filter(feature => isLightBinaryFeature(feature, featureSelectors)).length;
};

const isLightBinaryFeature = (feature, featureSelectors) => {
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

  const hasAtLeastTwoLightBinaryFeature = countLightBinaryFeature(deviceFeatures, featureSelectors) >= 2;

  // Create placeholder rows based on the number of expected features
  const placeholderRows = Array(featureSelectors.length).fill(0);

  return (
    <div class="card">
      {boxTitle && (
        <div class="card-header">
          <h3 class="card-title">{boxTitle}</h3>
          {hasAtLeastTwoLightBinaryFeature && (
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
      )}
      <div>
        <div class="loader py-3" />
        <div class="table-responsive">
          <table class="table card-table table-vcenter">
            <tbody>
              {loading
                ? placeholderRows.map((_, index) => (
                    <tr key={`placeholder-${index}`}>
                      <td class="w-50">
                        <div class={style.loadingSkeleton} />
                      </td>
                      <td>
                        <div class={style.loadingSkeleton} />
                      </td>
                    </tr>
                  ))
                : deviceFeatures.map((deviceFeature, deviceFeatureIndex) => (
                    <DeviceRow
                      key={deviceFeatureIndex}
                      user={props.user}
                      x={props.x}
                      y={props.y}
                      device={deviceFeature.device}
                      deviceFeature={deviceFeature}
                      roomIndex={props.roomIndex}
                      deviceFeatureIndex={deviceFeatureIndex}
                      updateValue={props.updateValue}
                      updateValueWithDebounce={props.updateValueWithDebounce}
                      intl={props.intl}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
