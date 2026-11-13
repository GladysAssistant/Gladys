import { EVENTS } from '../../../../../server/utils/constants';
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
import EnergyPriceChangedTrigger from './triggers/EnergyPriceChangedTrigger';
import ExternalIntegrationTrigger from './triggers/ExternalIntegrationTrigger';
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

// The parameter form of a trigger, shared by the desktop card (TriggerCard) and the mobile
// trigger sheet: both render the very same component for a trigger.
const TriggerParams = props => (
  <>
    {props.trigger.type === null && (
      <ChooseTriggerType
        updateTriggerProperty={props.updateTriggerProperty}
        index={props.index}
        sceneIntegrations={props.sceneIntegrations}
        autoFocusSearch={props.autoFocusSearch}
        fill={props.fill}
      />
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
      <WeatherAlert updateTriggerProperty={props.updateTriggerProperty} index={props.index} trigger={props.trigger} />
    )}
    {props.trigger.type === EVENTS.ENERGY_CONTRACT.PRICE_CHANGED && (
      <EnergyPriceChangedTrigger
        updateTriggerProperty={props.updateTriggerProperty}
        index={props.index}
        trigger={props.trigger}
      />
    )}
    {props.trigger.type === EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT && (
      <ExternalIntegrationTrigger
        updateTriggerProperty={props.updateTriggerProperty}
        index={props.index}
        trigger={props.trigger}
        sceneIntegrations={props.sceneIntegrations}
        setVariablesTrigger={props.setVariablesTrigger}
      />
    )}
  </>
);

export default TriggerParams;
