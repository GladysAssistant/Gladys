import { Text } from 'preact-i18n';
import { DEVICE_FEATURE_UNITS } from '../../../../../../server/utils/constants';
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
        {props.deviceFeature.last_value !== null && props.deviceFeature.last_value}
        {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        {props.deviceFeature.category === 'temperature-sensor' && props.deviceFeature.last_value !== null && (
          <span>{props.deviceFeature.unit === 'celsius' ? '°C' : '°F'}</span>
        )}
        {props.deviceFeature.category !== 'temperature-sensor' && props.deviceFeature.last_value !== null && (
          <span>
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.PERCENT && '%'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.KILOWATT && 'kW'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.KILOWATT_HOUR && 'kW/h'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.LUX && 'Lx'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.PASCAL && 'Pa'}
          </span>
        )}
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
