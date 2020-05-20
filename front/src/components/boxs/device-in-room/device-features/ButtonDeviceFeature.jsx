const ButtonDeviceType = ({ children, ...props }) => {
  function updateValue() {
    props.updateValue(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      props.deviceFeature.last_value === 0 ? 1 : 0
    );
  }

  return (
    <tr>
      <td>
        <i class="fe fe-circle" />
      </td>
      <td>{props.device.name}</td>
      <td class="text-right">
        <label class="custom-switch">
          <input
            type="button"
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

export default ButtonDeviceType;
