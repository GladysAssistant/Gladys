/* eslint-disable preact-i18n/no-unknown-key */
import { Text, Localizer } from 'preact-i18n';
import actions from './actions';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import SensorDeviceFeature from '../../../../../components/boxs/device-in-room/device-features/SensorDeviceFeature';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

import style from '../style.css';

const { getCardinalDirection } = require('../../../../../utils/cardinalPoints');
dayjs.extend(relativeTime);

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

const RenderCommandGlobal = ({ children, ...props }) => {
  return (
    <Localizer>
      <tr class={props.styleTest} title={props.title}>
        <td>
          <i
            class={`mr-2 fe fe-${get(
              DeviceFeatureCategoriesIcon,
              `${props.deviceFeature.category}.${props.deviceFeature.type}`
            )}`}
          />
        </td>
        <td>{props.deviceFeature.name}</td>
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
              {props.deviceFeature.last_value >= 1 && <i class={'fe fe-wifi'} />}
              {(props.deviceFeature.last_value === 0 || props.deviceFeature.last_value === null) && (
                <i class="fe fe-wifi-off" />
              )}
            </td>
          )}
        {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
          props.deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.INTEGER && (
            <td class={cx('text-right', { 'text-nowrap': props.deviceFeature.last_value !== null })}>
              <div class="page-options">
                {props.deviceFeature.last_value === 0 && (
                  <div class="tag tag-grey">
                    <Text id="global.percentValue" fields={{ value: props.deviceFeature.last_value }} />
                    <span class="tag-addon">
                      <i class="fe fe-zap-off" />
                    </span>
                  </div>
                )}
                {props.deviceFeature.last_value > 0 && props.deviceFeature.last_value < 50 && (
                  <div class="tag tag-yellow">
                    <Text id="global.percentValue" fields={{ value: props.deviceFeature.last_value }} />
                    <span class="tag-addon">
                      <i class="fe fe-zap" />
                    </span>
                  </div>
                )}
                {props.deviceFeature.last_value >= 50 && props.deviceFeature.last_value < 100 && (
                  <div class="tag tag-orange">
                    <Text id="global.percentValue" fields={{ value: props.deviceFeature.last_value }} />
                    <span class="tag-addon">
                      <i class="fe fe-zap" />
                    </span>
                  </div>
                )}
                {props.deviceFeature.last_value === 100 && (
                  <div class="tag tag-red">
                    <Text id="global.percentValue" fields={{ value: props.deviceFeature.last_value }} />
                    <span class="tag-addon">
                      <i class="fe fe-zap" />
                    </span>
                  </div>
                )}
              </div>
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
      </tr>
    </Localizer>
  );
};

@connect('session,httpClient,user', actions)
class SensorDeviceType extends Component {
  async getNetatmoConnect(netatmoIsConnect) {
    netatmoIsConnect = await this.props.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT');
    this.setState({ netatmoIsConnect }, () => {
      netatmoIsConnect;
    });
  }
  componentWillMount() {
    this.getNetatmoConnect();
  }

  render({ children, ...props }, { netatmoIsConnect }) {
    if (netatmoIsConnect && netatmoIsConnect.value === 'disconnect') {
      return (
        <RenderCommandGlobal
          {...props}
          netatmoIsConnect={netatmoIsConnect}
          styleTest={style.opacityLegerdisconnect}
          title={<Text id={`integration.netatmo.box.disconnect`} />}
        />
      );
    }
    if (
      SPECIAL_SENSORS_CATEGORY.indexOf(props.deviceFeature.category) === -1 &&
      SPECIAL_SENSORS_TYPE.indexOf(props.deviceFeature.type) === -1 &&
      SPECIAL_SENSORS_CATEGORY_TYPE.indexOf(props.deviceFeature.category + props.deviceFeature.type) === -1
    ) {
      return <SensorDeviceFeature user={props.user} deviceFeature={props.deviceFeature} />;
    }
    return <RenderCommandGlobal {...props} netatmoIsConnect={netatmoIsConnect} />;
  }
}

export default SensorDeviceType;
