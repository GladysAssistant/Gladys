import { Text } from 'preact-i18n';
import cx from 'classnames';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

const BINARY_CATEGORIES_TYPES_CUSTOM = {
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_COMMAND]: [
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_COMMAND.ALARM,
    DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_COMMAND.LOCK
  ]
};

const BinaryDeviceType = ({ children, ...props }) => {
  const { category, type, last_value: lastValue } = props.deviceFeature;
  const customText =
    BINARY_CATEGORIES_TYPES_CUSTOM[category] && BINARY_CATEGORIES_TYPES_CUSTOM[category].includes(type);

  function updateValue() {
    props.updateValue(props.deviceFeature, lastValue === 0 ? 1 : 0);
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      <td>{props.rowName}</td>
      <td class="text-right">
        {!customText ? (
          <label class="custom-switch">
            <input
              type="radio"
              name={`box-${props.x}-${props.y}-${props.deviceFeature.id}`}
              value="1"
              class="custom-switch-input"
              checked={lastValue}
              onClick={updateValue}
            />
            <span class="custom-switch-indicator" />
          </label>
        ) : (
          <div class="btn-group" role="group">
            <button
              class={cx('btn btn-sm btn-secondary', {
                active: lastValue === 0
              })}
              onClick={updateValue}
              disabled={lastValue === 0}
            >
              {lastValue === 0 ? (
                <Text id={`deviceFeatureAction.category.${category}.${type}.stateLiveFinished.${lastValue}`} />
              ) : (
                <Text id={`deviceFeatureAction.category.${category}.${type}.state.${lastValue}`} />
              )}
            </button>
            <button
              class={cx('btn btn-sm', 'btn-secondary', {
                active: lastValue === 1
              })}
              onClick={updateValue}
              disabled={lastValue === 1}
            >
              {lastValue === 1 ? (
                <Text id={`deviceFeatureAction.category.${category}.${type}.stateLiveFinished.${lastValue}`} />
              ) : (
                <Text id={`deviceFeatureAction.category.${category}.${type}.state.${lastValue}`} />
              )}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default BinaryDeviceType;
