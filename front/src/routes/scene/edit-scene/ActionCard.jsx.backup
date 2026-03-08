import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { useRef, useCallback } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';

import style from './style.css';
import { ACTIONS } from '../../../../../server/utils/constants';

// Actions cards
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
import HouseEmptyOrNotCondition from './actions/HouseEmptyOrNotCondition';
import CalendarIsEventRunning from './actions/CalendarIsEventRunning';
import EcowattCondition from './actions/EcowattCondition';
import SendMessageCameraParams from './actions/SendMessageCameraParams';
import CheckAlarmMode from './actions/CheckAlarmMode';
import SetAlarmMode from './actions/SetAlarmMode';
import SendMqttMessage from './actions/SendMqttMessage';
import SendZigbee2MqttMessage from './actions/SendZigbee2MqttMessage';
import PlayNotification from './actions/PlayNotification';
import EdfTempoCondition from './actions/EdfTempoCondition';
import AskAI from './actions/AskAI';
import SendSms from './actions/SendSms';
import ConditionIfElseThen from './actions/ConditionIfElseThen';

const ACTION_ICON = {
  [ACTIONS.LIGHT.TURN_ON]: 'fe fe-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'fe fe-toggle-left',
  [ACTIONS.LIGHT.TOGGLE]: 'fe fe-shuffle',
  [ACTIONS.LIGHT.BLINK]: 'fe fe-star',
  [ACTIONS.SWITCH.TURN_ON]: 'fe fe-toggle-right',
  [ACTIONS.SWITCH.TURN_OFF]: 'fe fe-toggle-left',
  [ACTIONS.SWITCH.TOGGLE]: 'fe fe-shuffle',
  [ACTIONS.TIME.DELAY]: 'fe fe-clock',
  [ACTIONS.MESSAGE.SEND]: 'fe fe-message-square',
  [ACTIONS.MESSAGE.SEND_CAMERA]: 'fe fe-message-square',
  [ACTIONS.CONDITION.IF_THEN_ELSE]: 'fe fe-shuffle',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'fe fe-shuffle',
  [ACTIONS.DEVICE.GET_VALUE]: 'fe fe-refresh-cw',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'fe fe-home',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'fe fe-home',
  [ACTIONS.HTTP.REQUEST]: 'fe fe-link',
  [ACTIONS.USER.CHECK_PRESENCE]: 'fe fe-home',
  [ACTIONS.CONDITION.CHECK_TIME]: 'fe fe-watch',
  [ACTIONS.SCENE.START]: 'fe fe-fast-forward',
  [ACTIONS.HOUSE.IS_EMPTY]: 'fe fe-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'fe fe-home',
  [ACTIONS.DEVICE.SET_VALUE]: 'fe fe-radio',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'fe fe-calendar',
  [ACTIONS.ECOWATT.CONDITION]: 'fe fe-zap',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'fe fe-zap',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'fe fe-bell',
  [ACTIONS.ALARM.SET_ALARM_MODE]: 'fe fe-bell',
  [ACTIONS.MQTT.SEND]: 'fe fe-message-square',
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: 'fe fe-speaker',
  [ACTIONS.ZIGBEE2MQTT.SEND]: 'fe fe-message-square',
  [ACTIONS.AI.ASK]: 'fe fe-cpu',
  [ACTIONS.SMS.SEND]: 'fe fe-message-circle'
};

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
  [ACTIONS.SCENE.START]: StartSceneParams,
  [ACTIONS.HOUSE.IS_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: HouseEmptyOrNotCondition,
  [ACTIONS.DEVICE.SET_VALUE]: DeviceSetValue,
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: CalendarIsEventRunning,
  [ACTIONS.ECOWATT.CONDITION]: EcowattCondition,
  [ACTIONS.EDF_TEMPO.CONDITION]: EdfTempoCondition,
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: CheckAlarmMode,
  [ACTIONS.ALARM.SET_ALARM_MODE]: SetAlarmMode,
  [ACTIONS.MQTT.SEND]: SendMqttMessage,
  [ACTIONS.ZIGBEE2MQTT.SEND]: SendZigbee2MqttMessage,
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: PlayNotification,
  [ACTIONS.AI.ASK]: AskAI,
  [ACTIONS.SMS.SEND]: SendSms,
  [ACTIONS.CONDITION.IF_THEN_ELSE]: ConditionIfElseThen
};

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';
const CONDITION_CARD_TYPE = 'CONDITION_CARD_TYPE';
const ACTION_CARD_IF_THEN_ELSE_TYPE = 'ACTION_CARD_IF_THEN_ELSE_TYPE';

const getDragAndDropType = (actionType, path) => {
  if (path.includes('if')) {
    return CONDITION_CARD_TYPE;
  }
  if (actionType === ACTIONS.CONDITION.IF_THEN_ELSE) {
    return ACTION_CARD_IF_THEN_ELSE_TYPE;
  }
  return ACTION_CARD_TYPE;
};

const ActionCard = ({ children, ...props }) => {
  const { path, deleteAction } = props;
  const ref = useRef(null);

  const handleDelete = useCallback(() => {
    deleteAction(path);
  }, [path, deleteAction]);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: getDragAndDropType(props.action.type, props.path),
    item: () => {
      return { path };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: getDragAndDropType(props.action.type, props.path),
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.path, path);
    }
  });
  preview(drop(ref));
  return (
    <div
      class={cx({
        'col-lg-12':
          props.action.type === ACTIONS.CONDITION.ONLY_CONTINUE_IF ||
          props.action.type === ACTIONS.CONDITION.IF_THEN_ELSE,
        'col-lg-6':
          props.action.type === ACTIONS.MESSAGE.SEND ||
          props.action.type === ACTIONS.CALENDAR.IS_EVENT_RUNNING ||
          props.action.type === ACTIONS.MQTT.SEND ||
          props.action.type === ACTIONS.ZIGBEE2MQTT.SEND ||
          props.action.type === ACTIONS.LIGHT.BLINK ||
          props.action.type === ACTIONS.SMS.SEND,
        'col-lg-4':
          props.action.type !== ACTIONS.CONDITION.ONLY_CONTINUE_IF &&
          props.action.type !== ACTIONS.MESSAGE.SEND &&
          props.action.type !== ACTIONS.CALENDAR.IS_EVENT_RUNNING &&
          props.action.type !== ACTIONS.SMS.SEND
      })}
    >
      <div
        ref={ref}
        class={cx('card cursor-pointer user-select-none', {
          [style.dropZoneActive]: isActive,
          [style.dropZoneDragging]: isDragging
        })}
      >
        <div ref={drag} class="card-header">
          {props.action.type !== null && <i class={cx(ACTION_ICON[props.action.type], 'dark-mode-fe-none-filter')} />}
          {props.action.type === null && <i class="fe fe-plus-circle" />}
          <div class="card-title">
            <i class={cx(props.action.icon, 'mr-4')} /> <Text id={`editScene.actions.${props.action.type}`} />
            {props.action.type === null && props.path.includes('if') && <Text id="editScene.newCondition" />}
            {props.action.type === null && !props.path.includes('if') && <Text id="editScene.newAction" />}
          </div>
          {props.highLightedActions && props.highLightedActions[`${props.columnIndex}:${props.index}`] && (
            <div class="card-status bg-blue" />
          )}
          <div class="card-options">
            <a>
              <i class="fe fe-move mr-4" />
            </a>
            <a onClick={handleDelete} class="card-options-remove">
              <i class="fe fe-x" />
            </a>
          </div>
        </div>
        <div class="card-body">
          {(() => {
            const Component = ACTION_COMPONENTS[props.action.type];
            if (!Component) return null;

            const commonProps = {
              action: props.action,
              allActions: props.allActions,
              path,
              updateActionProperty: props.updateActionProperty,
              variables: props.variables,
              setVariables: props.setVariables,
              actionsGroupsBefore: props.actionsGroupsBefore,
              triggersVariables: props.triggersVariables,
              deleteAction: props.deleteAction,
              deleteActionGroup: props.deleteActionGroup,
              addAction: props.addAction,
              moveCard: props.moveCard,
              moveCardGroup: props.moveCardGroup,
              scene: props.scene
            };

            return <Component {...commonProps} />;
          })()}
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
