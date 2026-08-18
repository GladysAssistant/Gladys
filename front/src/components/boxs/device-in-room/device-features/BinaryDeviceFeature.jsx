import AdaptiveOptionControl from './AdaptiveOptionControl';

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

  // The current-state button shows the live state and is disabled; the other one shows the action
  // that moves the device to its value. Some of these labels are long (e.g. the water heater's
  // "Annuler le boost"), so the pair goes through AdaptiveOptionControl, which collapses it to a
  // dropdown when the card is too narrow — such as in a 3-column dashboard layout.
  const options = [0, 1].map(optionValue => ({
    value: optionValue,
    i18nKey: lastValue === optionValue ? `stateLiveFinished.${optionValue}` : `state.${optionValue}`,
    disabled: lastValue === optionValue
  }));

  // Plain on/off rows toggle from a tap anywhere on the row, not only on the
  // 36px switch — on a phone the switch alone is far below the ~44px
  // touch-target floor, and the whole row reads as one control anyway
  // (HomeKit behaves the same). The label stops propagation so a tap
  // landing on the switch itself doesn't toggle twice.
  return (
    <tr class={!customText ? 'device-row-tappable' : undefined} onClick={!customText ? updateValue : undefined}>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      <td>{props.rowName}</td>
      {!customText ? (
        <td class="text-right">
          <label class="custom-switch" onClick={event => event.stopPropagation()}>
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
        </td>
      ) : (
        <AdaptiveOptionControl
          options={options}
          value={lastValue}
          category={category}
          type={type}
          updateValue={value => props.updateValue(props.deviceFeature, value)}
        />
      )}
    </tr>
  );
};

export default BinaryDeviceType;
