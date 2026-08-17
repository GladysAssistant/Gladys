import { Text } from 'preact-i18n';
import cx from 'classnames';
import { useState, useCallback } from 'preact/hooks';

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
import WeatherAlert from './triggers/WeatherAlert';

import { EVENTS } from '../../../../../server/utils/constants';
import { TRIGGER_ICON } from './typesCatalog';
import { getTriggerSummary } from './summary';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from './style.css';
import GladysStartTrigger from './triggers/GladysStartTrigger';

const WEATHER_ALERT_TRIGGERS = [EVENTS.WEATHER.ALERT_RAISED, EVENTS.WEATHER.ALERT_ENDED];

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

const TriggerCard = ({ children, ...props }) => {
  // A new trigger starts expanded (the type picker is shown), an existing one
  // starts collapsed with a short summary, like the action cards
  const [expanded, setExpanded] = useState(props.trigger.type === null);
  const toggleExpanded = useCallback(() => {
    setExpanded(previousExpanded => !previousExpanded);
  }, []);
  const summary = !expanded ? getTriggerSummary(props.trigger, props.intl.dictionary) : null;

  return (
    <div class="card user-select-none">
      <div class="card-header">
        {TRIGGER_ICON[props.trigger.type] && <i class={TRIGGER_ICON[props.trigger.type]} />}
        {props.trigger.type === null && <i class="fe fe-plus-circle" />}
        <div class={cx('card-title', style.stepCardTitle)} onClick={toggleExpanded}>
          <i class={cx('mr-3', props.trigger.icon)} />
          <Text id={`editScene.triggers.${props.trigger.type}`} />
          {props.trigger.type === null && <Text id="editScene.newTrigger" />}
          {summary && <span class={style.stepSummary}>{summary}</span>}
        </div>
        <div class="card-options">
          <a
            onClick={deleteTriggerFromList(props.deleteTrigger, props.index)}
            class="card-options-remove mr-4 cursor-pointer"
          >
            <i class="fe fe-x" />
          </a>
          <a onClick={toggleExpanded} class="cursor-pointer">
            <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
          </a>
        </div>
      </div>
      <div class={cx('card-body', { 'd-none': !expanded })}>
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
        {WEATHER_ALERT_TRIGGERS.includes(props.trigger.type) && (
          <WeatherAlert
            updateTriggerProperty={props.updateTriggerProperty}
            index={props.index}
            trigger={props.trigger}
          />
        )}
      </div>
    </div>
  );
};

export default withIntlAsProp(TriggerCard);
