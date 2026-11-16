import { ACTIONS } from '../../../../../server/utils/constants';

// The parameter form of each action type, shared by the desktop card (ActionCard) and the
// mobile step sheet: both render the very same component for a step.
import ChooseActionTypeParams from './actions/ChooseActionTypeCard';
import DelayActionParams from './actions/DelayActionParams';
import DeviceGetValueParams from './actions/DeviceGetValueParams';
import DeviceSetValue from './actions/DeviceSetValue';
import SendMessageParams from './actions/SendMessageParams';
import OnlyContinueIfParams from './actions/only-continue-if/OnlyContinueIfParams';
import TurnOnOffLightParams from './actions/TurnOnOffLightParams';
import BlinkLightParams from './actions/BlinkLightParams';
import TurnOnOffSwitchParams from './actions/TurnOnOffSwitchParams';
import StartSceneParams from './actions/StartSceneParams';
import UserPresence from './actions/UserPresence';
import HttpRequest from './actions/HttpRequest';
import CheckUserPresence from './actions/CheckUserPresence';
import CheckTime from './actions/CheckTime';
import InTimeRange from './actions/InTimeRange';
import HouseEmptyOrNotCondition from './actions/HouseEmptyOrNotCondition';
import CalendarIsEventRunning from './actions/CalendarIsEventRunning';
import CalendarGetEvents from './actions/CalendarGetEvents';
import EcowattCondition from './actions/EcowattCondition';
import SendMessageCameraParams from './actions/SendMessageCameraParams';
import CheckAlarmMode from './actions/CheckAlarmMode';
import SetAlarmMode from './actions/SetAlarmMode';
import SendMqttMessage from './actions/SendMqttMessage';
import SendZigbee2MqttMessage from './actions/SendZigbee2MqttMessage';
import ThermostatSetSchedule from './actions/ThermostatSetSchedule';
import PlayNotification from './actions/PlayNotification';
import PlayMedia from './actions/PlayMedia';
import EdfTempoCondition from './actions/EdfTempoCondition';
import EnergyCurrentPriceCondition from './actions/EnergyCurrentPriceCondition';
import AskAI from './actions/AskAI';
import SendSms from './actions/SendSms';
import ConditionIfElseThen from './actions/ConditionIfElseThen';
import ConditionWhile from './actions/ConditionWhile';
import SetVariable from './actions/SetVariable';
import GetDate from './actions/GetDate';
import ExternalIntegrationAction from './actions/ExternalIntegrationAction';

const ACTION_COMPONENTS = {
  [null]: ChooseActionTypeParams,
  [ACTIONS.TIME.DELAY]: DelayActionParams,
  [ACTIONS.LIGHT.TURN_ON]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.TURN_OFF]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.TOGGLE]: TurnOnOffLightParams,
  [ACTIONS.LIGHT.BLINK]: BlinkLightParams,
  [ACTIONS.SWITCH.TURN_ON]: TurnOnOffSwitchParams,
  [ACTIONS.SWITCH.TURN_OFF]: TurnOnOffSwitchParams,
  [ACTIONS.SWITCH.TOGGLE]: TurnOnOffSwitchParams,
  [ACTIONS.MESSAGE.SEND]: SendMessageParams,
  [ACTIONS.MESSAGE.SEND_CAMERA]: SendMessageCameraParams,
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: OnlyContinueIfParams,
  [ACTIONS.DEVICE.GET_VALUE]: DeviceGetValueParams,
  [ACTIONS.USER.SET_SEEN_AT_HOME]: UserPresence,
  [ACTIONS.USER.CHECK_PRESENCE]: CheckUserPresence,
  [ACTIONS.USER.SET_OUT_OF_HOME]: UserPresence,
  [ACTIONS.HTTP.REQUEST]: HttpRequest,
  [ACTIONS.CONDITION.CHECK_TIME]: CheckTime,
  [ACTIONS.CONDITION.IN_TIME_RANGE]: InTimeRange,
  [ACTIONS.SCENE.START]: StartSceneParams,
  [ACTIONS.HOUSE.IS_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.DEVICE.SET_VALUE]: DeviceSetValue,
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: CalendarIsEventRunning,
  [ACTIONS.CALENDAR.GET_EVENTS]: CalendarGetEvents,
  [ACTIONS.ECOWATT.CONDITION]: EcowattCondition,
  [ACTIONS.EDF_TEMPO.CONDITION]: EdfTempoCondition,
  [ACTIONS.ENERGY_CONTRACT.CURRENT_PRICE]: EnergyCurrentPriceCondition,
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: CheckAlarmMode,
  [ACTIONS.ALARM.SET_ALARM_MODE]: SetAlarmMode,
  [ACTIONS.MQTT.SEND]: SendMqttMessage,
  [ACTIONS.ZIGBEE2MQTT.SEND]: SendZigbee2MqttMessage,
  [ACTIONS.THERMOSTAT.SET_SCHEDULE]: ThermostatSetSchedule,
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: PlayNotification,
  [ACTIONS.MUSIC.PLAY_MEDIA]: PlayMedia,
  [ACTIONS.AI.ASK]: AskAI,
  [ACTIONS.SMS.SEND]: SendSms,
  [ACTIONS.CONDITION.IF_THEN_ELSE]: ConditionIfElseThen,
  [ACTIONS.CONDITION.WHILE]: ConditionWhile,
  [ACTIONS.VARIABLE.SET]: SetVariable,
  [ACTIONS.TIME.GET_DATE]: GetDate,
  [ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION]: ExternalIntegrationAction
};

export default ACTION_COMPONENTS;
