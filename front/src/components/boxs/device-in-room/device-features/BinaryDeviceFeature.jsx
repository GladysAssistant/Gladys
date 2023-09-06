const BinaryDeviceType = ({ children, ...props }) => {
  function updateValue() {
    props.updateValue(props.deviceFeature, props.deviceFeature.last_value === 0 ? 1 : 0);
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      <td>{props.rowName}</td>
      <td class="text-right">
        <label class="custom-switch">
          <input
            type="radio"
            name={`box-${props.x}-${props.y}-${props.deviceFeature.id}`}
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
