const OPEN_CLOSE_SENSORS = ['door-opening-sensor', 'window-opening-sensor'];

const SensorDeviceType = ({ children, ...props }) => (
  <tr>
    <td>
      {props.deviceFeature.category === 'temperature-sensor' && <i class="fe fe-thermometer" />}
      {props.deviceFeature.category === 'humidity-sensor' && <i class="fe fe-droplet" />}
      {props.deviceFeature.category === 'light-sensor' && <i class="fe fe-sun" />}
      {props.deviceFeature.category === 'battery-sensor' && <i class="fe fe-percent" />}
      {OPEN_CLOSE_SENSORS.indexOf(props.deviceFeature.category) !== -1 && <i class="fe fe-home" />}
      {props.deviceFeature.category === null && <i class="fe fe-bar-chart-2" />}
    </td>
    {props.deviceFeature.name && <td>{props.deviceFeature.name}</td>}
    {!props.deviceFeature.name && props.deviceFeature.type === 'binary' && <td>{props.deviceFeature.name}</td>}
    {!props.deviceFeature.name && props.deviceFeature.type !== 'binary' && (
      <td>
        {props.deviceFeature.name} - {props.deviceFeature.type}
      </td>
    )}
    {OPEN_CLOSE_SENSORS.indexOf(props.deviceFeature.category) === -1 && (
      <td class="text-right">
        {props.deviceFeature.last_value}
        {props.deviceFeature.category === 'temperature-sensor' && (
          <span>{props.deviceFeature.unit === 'celsius' ? '°C' : '°F'}</span>
        )}
        {props.deviceFeature.category !== 'temperature-sensor' && <span>{props.deviceFeature.unit}</span>}
      </td>
    )}
    {OPEN_CLOSE_SENSORS.indexOf(props.deviceFeature.category) !== -1 && (
      <td class="text-right">
        {props.deviceFeature.last_value === 1 && <i class="fe fe-shield" />}
        {props.deviceFeature.last_value === 0 && <i class="fe fe-shield-off" />}
      </td>
    )}
  </tr>
);

export default SensorDeviceType;
