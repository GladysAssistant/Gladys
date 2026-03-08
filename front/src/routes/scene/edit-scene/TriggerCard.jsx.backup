import { Text } from 'preact-i18n';
import cx from 'classnames';

import DeviceFeatureState from './triggers/DeviceFeatureState';
import ScheduledTrigger from './triggers/ScheduledTrigger';
import ChooseTriggerType from './triggers/ChooseTriggerTypeCard';
import SunriseSunsetTrigger from './triggers/SunriseSunsetTrigger';
import UserPresenceTrigger from './triggers/UserPresenceTrigger';
import HouseEmptyOrNot from './triggers/HouseEmptyOrNot';
import UserEnteredOrLeftArea from './triggers/UserEnteredOrLeftArea';
import CalendarEventIsComing from './triggers/CalendarEventIsComing';
import AlarmModeTrigger from './triggers/AlarmModeTrigger';
import MQTTReceivedTrigger from './triggers/MQTTReceivedTrigger';

import { EVENTS } from '../../../../../server/utils/constants';
import GladysStartTrigger from './triggers/GladysStartTrigger';

const TRIGGER_ICON = {
  [EVENTS.DEVICE.NEW_STATE]: 'fe-activity',
  [EVENTS.TIME.CHANGED]: 'fe-watch',
  [EVENTS.TIME.SUNSET]: 'fe-sunset',
  [EVENTS.TIME.SUNRISE]: 'fe-sunrise',
  [EVENTS.USER_PRESENCE.BACK_HOME]: 'fe-home',
  [EVENTS.USER_PRESENCE.LEFT_HOME]: 'fe-home',
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: 'fe-home',
  [EVENTS.AREA.USER_ENTERED]: 'fe-compass',
  [EVENTS.AREA.USER_LEFT]: 'fe-compass',
  [EVENTS.CALENDAR.EVENT_IS_COMING]: 'fe-calendar',
  [EVENTS.ALARM.ARM]: 'fe-bell',
  [EVENTS.ALARM.ARMING]: 'fe-clock',
  [EVENTS.ALARM.PARTIAL_ARM]: 'fe-bell',
  [EVENTS.ALARM.DISARM]: 'fe-bell-off',
  [EVENTS.ALARM.PANIC]: 'fe-alert-triangle',
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: 'fe-alert-triangle',
  [EVENTS.SYSTEM.START]: 'fe-activity',
  [EVENTS.MQTT.RECEIVED]: 'fe-hash'
};

const ALARM_TRIGGERS = [
  EVENTS.ALARM.ARM,
  EVENTS.ALARM.ARMING,
  EVENTS.ALARM.DISARM,
  EVENTS.ALARM.PARTIAL_ARM,
  EVENTS.ALARM.PANIC,
  EVENTS.ALARM.TOO_MANY_CODES_TESTS
];

const deleteTriggerFromList = (deleteTrigger, index) => () => {
  deleteTrigger(index);
};

const TriggerCard = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      {TRIGGER_ICON[props.trigger.type] && <i class={`fe ${TRIGGER_ICON[props.trigger.type]}`} />}
      {props.trigger.type === null && <i class="fe fe-plus-circle" />}
      <div class="card-title">
        <i class={cx('mr-3', props.trigger.icon)} />
        <Text id={`editScene.triggers.${props.trigger.type}`} />
        {props.trigger.type === null && <Text id="editScene.newTrigger" />}
      </div>
      <div class="card-options">
        {false && (
          <a class="card-options-collapse">
            <i class="fe fe-chevron-down" />
          </a>
        )}
        <a onClick={deleteTriggerFromList(props.deleteTrigger, props.index)} class="card-options-remove">
          <i class="fe fe-x" />
        </a>
      </div>
    </div>
    <div class="card-body">
      {props.trigger.type === null && (
        <ChooseTriggerType updateTriggerProperty={props.updateTriggerProperty} index={props.index} />
      )}
      {props.trigger.type === EVENTS.DEVICE.NEW_STATE && (
        <DeviceFeatureState
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.TIME.CHANGED && (
        <ScheduledTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.TIME.SUNRISE && (
        <SunriseSunsetTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.TIME.SUNSET && (
        <SunriseSunsetTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.HOUSE.EMPTY && (
        <HouseEmptyOrNot
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.HOUSE.NO_LONGER_EMPTY && (
        <HouseEmptyOrNot
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.USER_PRESENCE.BACK_HOME && (
        <UserPresenceTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.USER_PRESENCE.LEFT_HOME && (
        <UserPresenceTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.AREA.USER_ENTERED && (
        <UserEnteredOrLeftArea
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.AREA.USER_LEFT && (
        <UserEnteredOrLeftArea
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.CALENDAR.EVENT_IS_COMING && (
        <CalendarEventIsComing
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
          variables={props.variables}
          setVariablesTrigger={props.setVariablesTrigger}
        />
      )}
      {ALARM_TRIGGERS.includes(props.trigger.type) && (
        <AlarmModeTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.SYSTEM.START && (
        <GladysStartTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.MQTT.RECEIVED && (
        <MQTTReceivedTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
    </div>
  </div>
);

export default TriggerCard;
