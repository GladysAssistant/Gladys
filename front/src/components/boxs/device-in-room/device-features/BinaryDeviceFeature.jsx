import { Text } from 'preact-i18n';
import cx from 'classnames';

const BinaryDeviceType = ({ children, ...props }) => {
  const { category, type, last_value: lastValue } = props.deviceFeature;
  const { dictionary } = props.intl;
  const customText =
    dictionary.deviceFeatureAction.category[category] && dictionary.deviceFeatureAction.category[category][type];

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
