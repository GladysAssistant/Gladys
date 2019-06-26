const BinaryDeviceType = ({ children, ...props }) => {
  function updateValue() {
    props.updateValue(
      props.device,
      props.deviceFeature,
      props.roomIndex,
      props.deviceIndex,
      props.deviceFeatureIndex,
      !props.deviceFeature.lastValue,
      props.deviceFeature.lastValue
    );
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      {props.deviceFeature.deviceFeatureName && <td>{props.deviceFeature.deviceFeatureName}</td>}
      {!props.deviceFeature.deviceFeatureName && <td>{props.deviceFeature.name}</td>}
      <td class="text-right">
        <label class="custom-switch">
          <input
            type="radio"
            name={props.deviceFeature.id}
            value="1"
            class="custom-switch-input"
            checked={props.deviceFeature.last_value}
            onClick={updateValue}
          />
          <span class="custom-switch-indicator" />
        </label>
      </td>
    </tr>
  );
};

export default BinaryDeviceType;
