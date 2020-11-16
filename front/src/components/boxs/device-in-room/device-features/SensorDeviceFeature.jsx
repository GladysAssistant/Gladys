import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_UNITS, DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';

const SPECIAL_SENSORS = [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR];

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const SensorDeviceType = ({ children, ...props }) => (
  <tr>
    <td>
      <i
        class={`mr-2 fe fe-${get(
          DeviceFeatureCategoriesIcon,
          `${props.deviceFeature.category}.${props.deviceFeature.type}`
        )}`}
      />
    </td>
    <td>{props.deviceFeature.name}</td>
    {SPECIAL_SENSORS.indexOf(props.deviceFeature.category) === -1 && (
      <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value !== null })}>
        {props.deviceFeature.last_value !== null && props.deviceFeature.last_value}
        {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        {props.deviceFeature.last_value !== null && (
          <span>
            {' '}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.PERCENT && '%'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.CELSIUS && '°C'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT && '°F'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.WATT && 'W'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.KILOWATT && 'kW'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.KILOWATT_HOUR && 'kW/h'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.LUX && 'Lx'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.PASCAL && 'Pa'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.AMPERE && 'A'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.VOLT && 'V'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.PPM && 'ppm'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.KILOGRAM && 'kg'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.CENTIMETER && 'kg'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.MERCURE_MILIMETER && 'kg'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.BEATS_PER_MINUTE && 'bpm'}
            {props.deviceFeature.unit === DEVICE_FEATURE_UNITS.METER_PER_SECOND && 'm/s'}
          </span>
        )}
      </td>
    )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR && (
      <td class="text-right">
        {props.deviceFeature.last_value === 1 && <i class="fe fe-shield" />}
        {props.deviceFeature.last_value === 0 && <i class="fe fe-shield-off" />}
      </td>
    )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR && (
      <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value_changed })}>
        {!props.deviceFeature.last_value_changed && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        {props.deviceFeature.last_value_changed &&
          dayjs(props.deviceFeature.last_value_changed)
            .locale(props.user.language)
            .fromNow()}
      </td>
    )}
  </tr>
);

export default SensorDeviceType;
