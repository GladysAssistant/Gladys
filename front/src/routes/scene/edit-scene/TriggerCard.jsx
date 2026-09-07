import { Localizer, Text } from 'preact-i18n';
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
import { TRIGGER_ICON, TRIGGER_COLOR, COLOR_CLASS } from './typesCatalog';
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
    <div class={cx('card user-select-none', style.stepCard)}>
      <div class={cx('card-header', style.stepCardHeader)}>
        <span
          class={cx(style.stepIconTile, style[COLOR_CLASS[TRIGGER_COLOR[props.trigger.type]] || 'typePickerIconGray'])}
        >
          {TRIGGER_ICON[props.trigger.type] && <i class={TRIGGER_ICON[props.trigger.type]} />}
          {props.trigger.type === null && <i class="fe fe-plus-circle" />}
        </span>
        <div class={style.stepText} onClick={toggleExpanded}>
          <span class={style.stepLabel}>
            <Text id={`editScene.triggers.${props.trigger.type}`} />
            {props.trigger.type === null && <Text id="editScene.newTrigger" />}
          </span>
          {summary && <span class={style.stepSummary}>{summary}</span>}
        </div>
        <div class="card-options">
          <Localizer>
            <button
              type="button"
              onClick={deleteTriggerFromList(props.deleteTrigger, props.index)}
              class={cx('card-options-remove mr-4', style.cardOptionButton)}
              aria-label={<Text id="editScene.deleteTriggerButton" />}
            >
              <i class="fe fe-x" />
            </button>
          </Localizer>
          <Localizer>
            <button
              type="button"
              onClick={toggleExpanded}
              class={style.cardOptionButton}
              aria-expanded={expanded}
              aria-label={<Text id={expanded ? 'editScene.collapseStepButton' : 'editScene.expandStepButton'} />}
            >
              <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
            </button>
          </Localizer>
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
