import { h } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';
import { useCallback, useState } from 'preact/hooks';

import style from './style.css';
import { ACTIONS } from '../../../../../server/utils/constants';
import { ACTION_ICON, ACTION_COLOR, COLOR_CLASS } from './typesCatalog';
import {
  getGroupPath,
  startStepDrag,
  startParallelCardDrag,
  startConditionDrag,
  moveStepWithKeyboard,
  moveParallelCardWithKeyboard,
  moveConditionWithKeyboard
} from './stepDrag';
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
import GetDate from './actions/GetDate';

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
  [ACTIONS.VARIABLE.SET]: SetVariable,
  [ACTIONS.TIME.GET_DATE]: GetDate
};

const ActionCard = ({ children, ...props }) => {
  const { path, deleteAction, addAction, moveCard, moveCardGroup } = props;
  const groupPath = getGroupPath(path);
  const cardIndex = parseInt(path.split('.').pop(), 10);
  // The conditions of an if/while block are a flat list, not a group of actions
  const isCondition = path.includes('if');
  const isSequentialStep = props.isSequentialStep && !isCondition;
  // A card of an "at the same time" block: it moves on its own, while a
  // sequential step moves as a whole group
  const isParallelMember = !isCondition && !isSequentialStep;

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

  // The drag handle drives the pointer-events engine; the arrow keys move
  // the card one position at a time, so dragging is never the only way
  const onHandlePointerDown = useCallback(
    event => {
      if (isCondition) {
        startConditionDrag(event, { actionPath: path, moveCard });
      } else if (isSequentialStep) {
        startStepDrag(event, { groupPath, moveCardGroup });
      } else {
        startParallelCardDrag(event, { actionPath: path, moveCard });
      }
    },
    [isCondition, isSequentialStep, path, groupPath, moveCard, moveCardGroup]
  );
  const onHandleKeyDown = useCallback(
    event => {
      if (isCondition) {
        moveConditionWithKeyboard(event, { actionPath: path, moveCard });
      } else if (isSequentialStep) {
        moveStepWithKeyboard(event, { groupPath, moveCardGroup });
      } else {
        moveParallelCardWithKeyboard(event, { actionPath: path, moveCard });
      }
    },
    [isCondition, isSequentialStep, path, groupPath, moveCard, moveCardGroup]
  );

  const summary = !isExpanded ? getActionSummary(props.action, props.intl.dictionary) : null;

  // A card of a parallel block and a condition are slots of their list, so
  // the drop placement can be computed from the pointer position alone
  const slotAttributes = isCondition
    ? { 'data-condition-slot': true, 'data-card-index': cardIndex }
    : isParallelMember
    ? { 'data-card-slot': true, 'data-card-index': cardIndex }
    : {};
  // A plain step welcomes a dropped parallel card: it joins the step as an
  // "at the same time" action (structural blocks and the type picker do not)
  const mergeAttributes =
    isSequentialStep && !isStructuralCondition && props.action.type !== null
      ? {
          'data-step-merge': true,
          'data-group-path': groupPath,
          'data-drop-active-class': style.mergeTargetActive
        }
      : {};

  return (
    <div class="col-12" {...slotAttributes}>
      <div class={cx('card user-select-none', style.stepCard)} {...mergeAttributes}>
        <div class={cx('card-header', style.stepCardHeader)}>
          <span
            class={cx(style.stepIconTile, style[COLOR_CLASS[ACTION_COLOR[props.action.type]] || 'typePickerIconGray'])}
          >
            {props.action.type !== null && <i class={cx(ACTION_ICON[props.action.type], 'dark-mode-fe-none-filter')} />}
            {props.action.type === null && <i class="fe fe-plus-circle" />}
          </span>
          <div class={style.stepText} onClick={toggleExpanded}>
            <span class={style.stepLabel} data-step-label>
              <Text id={`editScene.actions.${props.action.type}`} />
              {props.action.type === null && props.path.includes('if') && <Text id="editScene.newCondition" />}
              {props.action.type === null && !props.path.includes('if') && <Text id="editScene.newAction" />}
            </span>
            {summary && <span class={style.stepSummary}>{summary}</span>}
          </div>
          {props.highLightedActions && props.highLightedActions[`${props.columnIndex}:${props.index}`] && (
            <div class="card-status bg-blue" />
          )}
          <div class="card-options">
            <Localizer>
              <button
                type="button"
                class={cx('mr-4', style.cardOptionButton, style.dragHandle)}
                data-cy={`drag-step-${path}`}
                onPointerDown={onHandlePointerDown}
                onKeyDown={onHandleKeyDown}
                aria-label={<Text id="editScene.moveHandleLabel" />}
              >
                <i class="fe fe-move" />
              </button>
            </Localizer>
            <Localizer>
              <button
                type="button"
                onClick={handleDelete}
                class={cx('card-options-remove mr-4', style.cardOptionButton)}
                aria-label={
                  <Text id={isCondition ? 'editScene.deleteConditionButton' : 'editScene.deleteActionButton'} />
                }
              >
                <i class="fe fe-x" />
              </button>
            </Localizer>
            {!isStructuralCondition && (
              <Localizer>
                <button
                  type="button"
                  onClick={toggleExpanded}
                  class={style.cardOptionButton}
                  aria-expanded={isExpanded}
                  aria-label={<Text id={isExpanded ? 'editScene.collapseStepButton' : 'editScene.expandStepButton'} />}
                >
                  <i class={cx('fe', isExpanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
                </button>
              </Localizer>
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
              <button
                type="button"
                class={cx('text-muted', style.parallelLink, style.cardOptionButton)}
                onClick={addParallelAction}
              >
                <i class="fe fe-git-merge" /> <Text id="editScene.addParallelActionButton" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withIntlAsProp(ActionCard);
