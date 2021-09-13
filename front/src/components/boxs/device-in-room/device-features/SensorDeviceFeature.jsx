import { Text } from 'preact-i18n';
import get from 'get-value';
import RelativeTime from '../../../device/RelativeTime';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';

const SPECIAL_SENSORS = [
  DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
  DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR
];
const LAST_SEEN_SENSORS = [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR, DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR];

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
      <td class="text-right">
        <div>
          {props.deviceFeature.last_value !== null && props.deviceFeature.last_value}
          {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
          {props.deviceFeature.last_value !== null && (
            <span>
              {' '}
              <Text id={`deviceFeatureUnitShort.${props.deviceFeature.unit}`} />
            </span>
          )}
        </div>
      </td>
    )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR && (
      <td class="text-right">
        {props.deviceFeature.last_value === 1 && <i class="fe fe-shield" />}
        {props.deviceFeature.last_value === 0 && <i class="fe fe-shield-off" />}
      </td>
    )}
    {LAST_SEEN_SENSORS.includes(props.deviceFeature.category) && (
      <td class="text-right">
        <div>
          {!props.deviceFeature.last_value_changed && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
          {props.deviceFeature.last_value_changed && (
            <RelativeTime datetime={props.deviceFeature.last_value_changed} language={props.user.language} />
          )}
        </div>
      </td>
    )}
  </tr>
);

export default SensorDeviceType;
