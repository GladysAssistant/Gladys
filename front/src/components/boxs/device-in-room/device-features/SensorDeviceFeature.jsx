/* eslint-disable preact-i18n/no-unknown-key */
import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
const { getCardinalDirection } = require('../../../../utils/cardinalPoints');

dayjs.extend(relativeTime);

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

const SPECIAL_SENSORS_CATEGORY = [
  DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
  DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.INDEX
];
const SPECIAL_SENSORS_TYPE = [DEVICE_FEATURE_CATEGORIES.SWITCH.BINARY];
const SPECIAL_SENSORS_CATEGORY_TYPE = [
  DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR + DEVICE_FEATURE_TYPES.SENSOR.STRING,
  DEVICE_FEATURE_CATEGORIES.INDEX + DEVICE_FEATURE_TYPES.INDEX.INTEGER,
  DEVICE_FEATURE_CATEGORIES.SETPOINT + DEVICE_FEATURE_TYPES.SETPOINT.STRING
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
    {SPECIAL_SENSORS_CATEGORY.indexOf(props.deviceFeature.category) === -1 &&
      SPECIAL_SENSORS_TYPE.indexOf(props.deviceFeature.type) === -1 &&
      SPECIAL_SENSORS_CATEGORY_TYPE.indexOf(props.deviceFeature.category + props.deviceFeature.type) === -1 && (
        <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value !== null })}>
          {props.deviceFeature.last_value !== null && props.deviceFeature.last_value}
          {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
          {props.deviceFeature.last_value !== null && (
            <span> {<Text id={`deviceFeatureUnitShort.${props.deviceFeature.unit}`} />}</span>
          )}
        </td>
      )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR && (
      <td class="text-right">
        {props.deviceFeature.last_value === 1 && <i class="fe fe-shield" />}
        {props.deviceFeature.last_value === 0 && <i class="fe fe-shield-off" />}
        {props.deviceFeature.last_value === -1 && <i class="fe fe-alert-triangle" />}
      </td>
    )}
    {LAST_SEEN_SENSORS.includes(props.deviceFeature.category) && (
      <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value_changed })}>
        {!props.deviceFeature.last_value_changed && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        {props.deviceFeature.last_value_changed &&
          dayjs(props.deviceFeature.last_value_changed)
            .locale(props.user.language)
            .fromNow()}
      </td>
    )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
      props.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY && (
        <td class="text-right">
          {props.deviceFeature.last_value === 1 && <i class="fe fe-power" />}
          {props.deviceFeature.last_value === 0 ||
            (props.deviceFeature.last_value === null && <i class="fe fe-zap-off" />)}
        </td>
      )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
      props.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.INTEGER && (
        <td class="text-right">
          {props.deviceFeature.last_value >= 1 && <i class="fe fe-power" />}
          {props.deviceFeature.last_value === 0 ||
            (props.deviceFeature.last_value === null && <i class="fe fe-zap-off" />)}
        </td>
      )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.INDEX &&
      props.deviceFeature.type === DEVICE_FEATURE_TYPES.INDEX.DIMMER && (
        <td class="text-right">
          {props.deviceFeature.last_value === 0 && (
            <span class="badge badge-info">
              <Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.healthy" />
            </span>
          )}
          {props.deviceFeature.last_value === 1 && (
            <span class="badge badge-success">
              {<Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.fine" />}
            </span>
          )}
          {props.deviceFeature.last_value === 2 && (
            <span class="badge badge-secondary">
              {<Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.fair" />}
            </span>
          )}
          {props.deviceFeature.last_value === 3 && (
            <span class="badge badge-warning">
              {<Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.poor" />}
            </span>
          )}
          {props.deviceFeature.last_value === 4 && (
            <span class="badge badge-danger">
              <Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.unhealthy" />
            </span>
          )}
          {props.deviceFeature.last_value === -1 ||
            (props.deviceFeature.last_value === null && (
              <span class="badge badge-dark">
                <Text id="integration.netatmo.healthHomeCoach.airQualityHealthIndex.null" />
              </span>
            ))}
        </td>
      )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR &&
      props.deviceFeature.type === DEVICE_FEATURE_TYPES.SENSOR.STRING && (
        <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value !== null })}>
          {props.deviceFeature.last_value !== null && (
            <Text id={`cardinalPoints.${getCardinalDirection(props.deviceFeature.last_value)}`} />
          )}
          {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        </td>
      )}
    {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SETPOINT &&
      props.deviceFeature.type === DEVICE_FEATURE_TYPES.SETPOINT.STRING && (
        <td class="text-right">
          {props.deviceFeature.last_value !== null && (
            <Text
              id={`integration.netatmo.DeviceFeatureValues.energy.setpointmode.${props.deviceFeature.last_value}`}
            />
          )}
          {props.deviceFeature.last_value === null && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
        </td>
      )}
  </tr>
);

export default SensorDeviceType;
