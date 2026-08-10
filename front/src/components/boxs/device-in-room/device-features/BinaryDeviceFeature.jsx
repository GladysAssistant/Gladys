import { Text } from 'preact-i18n';
import cx from 'classnames';

const BinaryDeviceType = ({ children, ...props }) => {
  const { category, type, last_value: lastValue } = props.deviceFeature;
  const { dictionary } = props.intl;
  const customText =
    dictionary.deviceFeatureAction.category[category] && dictionary.deviceFeatureAction.category[category][type];

  // Both buttons write the opposite of the current value, so the enabled one must be labelled
  // with the action that applies that target value, not with the value the device is already in.
  const targetValue = lastValue === 0 ? 1 : 0;

  function updateValue() {
    props.updateValue(props.deviceFeature, targetValue);
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
                <Text id={`deviceFeatureAction.category.${category}.${type}.state.${targetValue}`} />
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
                <Text id={`deviceFeatureAction.category.${category}.${type}.state.${targetValue}`} />
              )}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default BinaryDeviceType;
