const LightTemperatureDeviceType = ({ children, ...props }) => {
  function updateValue(e) {
    props.updateValueWithDebounce(props.deviceFeature, e.target.value);
  }

  return (
    <tr>
      <td>
        <i class="fe fe-thermometer" />
      </td>
      <td>{props.rowName}</td>

      <td class="text-right py-0">
        <div class="col">
          <input
            type="range"
            value={props.deviceFeature.last_value}
            onChange={updateValue}
            class="custom-range light-temperature"
            step="1"
            min={props.deviceFeature.min}
            max={props.deviceFeature.max}
          />
        </div>
      </td>
    </tr>
  );
};

export default LightTemperatureDeviceType;
