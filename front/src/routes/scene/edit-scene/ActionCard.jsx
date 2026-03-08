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
  [ACTIONS.LIGHT.TURN_ON]: 'icon-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'icon-toggle-left',
  [ACTIONS.LIGHT.TOGGLE]: 'icon-shuffle',
  [ACTIONS.LIGHT.BLINK]: 'icon-star',
  [ACTIONS.SWITCH.TURN_ON]: 'icon-toggle-right',
  [ACTIONS.SWITCH.TURN_OFF]: 'icon-toggle-left',
  [ACTIONS.SWITCH.TOGGLE]: 'icon-shuffle',
  [ACTIONS.TIME.DELAY]: 'icon-clock',
  [ACTIONS.MESSAGE.SEND]: 'icon-message-square',
  [ACTIONS.MESSAGE.SEND_CAMERA]: 'icon-message-square',
  [ACTIONS.CONDITION.IF_THEN_ELSE]: 'icon-shuffle',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'icon-shuffle',
  [ACTIONS.DEVICE.GET_VALUE]: 'icon-refresh-cw',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'icon-home',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'icon-home',
  [ACTIONS.HTTP.REQUEST]: 'icon-link',
  [ACTIONS.USER.CHECK_PRESENCE]: 'icon-home',
  [ACTIONS.CONDITION.CHECK_TIME]: 'icon-watch',
  [ACTIONS.SCENE.START]: 'icon-fast-forward',
  [ACTIONS.HOUSE.IS_EMPTY]: 'icon-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'icon-home',
  [ACTIONS.DEVICE.SET_VALUE]: 'icon-radio',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'icon-calendar',
  [ACTIONS.ECOWATT.CONDITION]: 'icon-zap',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'icon-zap',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'icon-bell',
  [ACTIONS.ALARM.SET_ALARM_MODE]: 'icon-bell',
  [ACTIONS.MQTT.SEND]: 'icon-message-square',
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: 'icon-speaker',
  [ACTIONS.ZIGBEE2MQTT.SEND]: 'icon-message-square',
  [ACTIONS.AI.ASK]: 'icon-cpu',
  [ACTIONS.SMS.SEND]: 'icon-message-circle'
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
          {props.action.type === null && <i class="icon-circle-plus" />}
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
              <i class="icon-move mr-4" />
            </a>
            <a onClick={handleDelete} class="card-options-remove">
              <i class="icon-x" />
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
