import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { useRef, useCallback, useState } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';

import style from './style.css';
import { ACTIONS } from '../../../../../server/utils/constants';
import { ACTION_ICON } from './typesCatalog';
import { getActionSummary } from './summary';
import withIntlAsProp from '../../../utils/withIntlAsProp';

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
import CalendarGetEvents from './actions/CalendarGetEvents';
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
import ConditionWhile from './actions/ConditionWhile';
import SetVariable from './actions/SetVariable';

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
  [ACTIONS.CALENDAR.GET_EVENTS]: CalendarGetEvents,
  [ACTIONS.ECOWATT.CONDITION]: EcowattCondition,
  [ACTIONS.EDF_TEMPO.CONDITION]: EdfTempoCondition,
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: CheckAlarmMode,
  [ACTIONS.ALARM.SET_ALARM_MODE]: SetAlarmMode,
  [ACTIONS.MQTT.SEND]: SendMqttMessage,
  [ACTIONS.ZIGBEE2MQTT.SEND]: SendZigbee2MqttMessage,
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: PlayNotification,
  [ACTIONS.AI.ASK]: AskAI,
  [ACTIONS.SMS.SEND]: SendSms,
  [ACTIONS.CONDITION.IF_THEN_ELSE]: ConditionIfElseThen,
  [ACTIONS.CONDITION.WHILE]: ConditionWhile,
  [ACTIONS.VARIABLE.SET]: SetVariable
};

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';
const CONDITION_CARD_TYPE = 'CONDITION_CARD_TYPE';
const ACTION_CARD_IF_THEN_ELSE_TYPE = 'ACTION_CARD_IF_THEN_ELSE_TYPE';

const getDragAndDropType = (actionType, path) => {
  if (path.includes('if')) {
    return CONDITION_CARD_TYPE;
  }
  if (actionType === ACTIONS.CONDITION.IF_THEN_ELSE || actionType === ACTIONS.CONDITION.WHILE) {
    return ACTION_CARD_IF_THEN_ELSE_TYPE;
  }
  return ACTION_CARD_TYPE;
};

const ActionCard = ({ children, ...props }) => {
  const { path, deleteAction, addAction } = props;
  const ref = useRef(null);

  // Structural conditions embed their own action groups: they cannot be collapsed
  const isStructuralCondition =
    props.action.type === ACTIONS.CONDITION.IF_THEN_ELSE || props.action.type === ACTIONS.CONDITION.WHILE;
  // A new action starts expanded (the type picker is shown), an existing one starts
  // collapsed so the scene can be read at a glance
  const [expanded, setExpanded] = useState(props.action.type === null);
  const isExpanded = expanded || isStructuralCondition;

  const toggleExpanded = useCallback(() => {
    setExpanded(previousExpanded => !previousExpanded);
  }, []);

  const handleDelete = useCallback(() => {
    deleteAction(path);
  }, [path, deleteAction]);

  const addParallelAction = useCallback(() => {
    addAction(
      path
        .split('.')
        .slice(0, -1)
        .join('.')
    );
  }, [path, addAction]);

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

  const summary = !isExpanded ? getActionSummary(props.action, props.intl.dictionary) : null;
  const isCondition = props.path.includes('if');

  return (
    <div class="col-12">
      <div
        ref={ref}
        class={cx('card user-select-none', {
          [style.dropZoneActive]: isActive,
          [style.dropZoneDragging]: isDragging
        })}
      >
        <div ref={drag} class={cx('card-header', style.stepCardHeader)}>
          {props.action.type !== null && <i class={cx(ACTION_ICON[props.action.type], 'dark-mode-fe-none-filter')} />}
          {props.action.type === null && <i class="fe fe-plus-circle" />}
          <div class={cx('card-title', style.stepCardTitle)} onClick={toggleExpanded}>
            <i class={cx(props.action.icon, 'mr-4')} /> <Text id={`editScene.actions.${props.action.type}`} />
            {props.action.type === null && props.path.includes('if') && <Text id="editScene.newCondition" />}
            {props.action.type === null && !props.path.includes('if') && <Text id="editScene.newAction" />}
            {summary && <span class={style.stepSummary}>{summary}</span>}
          </div>
          {props.highLightedActions && props.highLightedActions[`${props.columnIndex}:${props.index}`] && (
            <div class="card-status bg-blue" />
          )}
          <div class="card-options">
            <a class="cursor-pointer">
              <i class="fe fe-move mr-4" />
            </a>
            <a onClick={handleDelete} class="card-options-remove mr-4 cursor-pointer">
              <i class="fe fe-x" />
            </a>
            {!isStructuralCondition && (
              <a onClick={toggleExpanded} class="cursor-pointer">
                <i class={cx('fe', isExpanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
              </a>
            )}
          </div>
        </div>
        <div class={cx('card-body', { 'd-none': !isExpanded })}>
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
          {!isCondition && !isStructuralCondition && props.action.type !== null && props.showParallelLink && (
            <div class="text-right mt-3">
              <a class={cx('cursor-pointer text-muted', style.parallelLink)} onClick={addParallelAction}>
                <i class="fe fe-git-merge" /> <Text id="editScene.addParallelActionButton" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withIntlAsProp(ActionCard);
