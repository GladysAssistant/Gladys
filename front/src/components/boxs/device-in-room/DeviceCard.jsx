import DeviceRow from './DeviceRow';
import LightDeviceFeature from './device-features/light/LightDeviceFeature';
import { buildDeviceRows } from './device-features/light/lightFeatures';
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

  // Every light feature of a same device is merged into one row opening the light panel; every
  // other feature keeps the row it has always had.
  const rows = buildDeviceRows(deviceFeatures);

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
          {/* device-list-table: Horizon restyle hook — the glass theme turns
              these rows into soft pills (see routes/dashboard/style.css).
              device-widget-table narrows the rules that only make sense for
              the widget's icon/name/control triplet: the devices page shares
              device-list-table but lays its rows out on six columns. */}
          <table class="table card-table table-vcenter device-list-table device-widget-table">
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
                : rows.map(row =>
                    row.features ? (
                      <LightDeviceFeature
                        key={row.key}
                        x={props.x}
                        y={props.y}
                        device={row.device}
                        features={row.features}
                        updateValue={props.updateValue}
                        updateValueWithDebounce={props.updateValueWithDebounce}
                        intl={props.intl}
                      />
                    ) : (
                      <DeviceRow
                        key={row.key}
                        user={props.user}
                        x={props.x}
                        y={props.y}
                        device={row.deviceFeature.device}
                        deviceFeature={row.deviceFeature}
                        roomIndex={props.roomIndex}
                        deviceFeatureIndex={row.index}
                        updateValue={props.updateValue}
                        updateValueWithDebounce={props.updateValueWithDebounce}
                        intl={props.intl}
                      />
                    )
                  )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
