import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { ACTIONS } from '../../../../../server/utils/constants';

// Actions cards
import ChooseActionTypeParams from './actions/ChooseActionTypeCard';
import DelayActionParams from './actions/DelayActionParams';
import DeviceGetValueParams from './actions/DeviceGetValueParams';
import DeviceSetValue from './actions/DeviceSetValue';
import SendMessageParams from './actions/SendMessageParams';
import OnlyContinueIfParams from './actions/only-continue-if/OnlyContinueIfParams';
import TurnOnOffLightParams from './actions/TurnOnOffLightParams';
import TurnOnOffSwitchParams from './actions/TurnOnOffSwitchParams';
import StartSceneParams from './actions/StartSceneParams';
import UserPresence from './actions/UserPresence';
import HttpRequest from './actions/HttpRequest';
import CheckUserPresence from './actions/CheckUserPresence';
import CheckTime from './actions/CheckTime';
import HouseEmptyOrNotCondition from './actions/HouseEmptyOrNotCondition';
import CalendarIsEventRunning from './actions/CalendarIsEventRunning';

const deleteActionFromColumn = (columnIndex, rowIndex, deleteAction) => () => {
  deleteAction(columnIndex, rowIndex);
};

const ACTION_ICON = {
  [ACTIONS.LIGHT.TURN_ON]: 'ti ti-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'ti ti-toggle-left',
  [ACTIONS.SWITCH.TURN_ON]: 'ti ti-toggle-right',
  [ACTIONS.SWITCH.TURN_OFF]: 'ti ti-toggle-left',
  [ACTIONS.TIME.DELAY]: 'ti ti-clock',
  [ACTIONS.MESSAGE.SEND]: 'ti ti-message',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'ti ti-shuffle',
  [ACTIONS.DEVICE.GET_VALUE]: 'ti ti-refresh-cw',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'ti ti-home',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'ti ti-home',
  [ACTIONS.HTTP.REQUEST]: 'ti ti-link',
  [ACTIONS.USER.CHECK_PRESENCE]: 'ti ti-home',
  [ACTIONS.CONDITION.CHECK_TIME]: 'ti ti-watch',
  [ACTIONS.SCENE.START]: 'ti ti-fast-forward',
  [ACTIONS.HOUSE.IS_EMPTY]: 'ti ti-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'ti ti-home',
  [ACTIONS.DEVICE.SET_VALUE]: 'ti ti-radio',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'ti ti-calendar'
};

const ActionCard = ({ children, ...props }) => (
  <div
    class={cx({
      'col-lg-12': props.action.type === ACTIONS.CONDITION.ONLY_CONTINUE_IF,
      'col-lg-6': props.action.type === ACTIONS.MESSAGE.SEND || props.action.type === ACTIONS.CALENDAR.IS_EVENT_RUNNING,
      'col-lg-4':
        props.action.type !== ACTIONS.CONDITION.ONLY_CONTINUE_IF &&
        props.action.type !== ACTIONS.MESSAGE.SEND &&
        props.action.type !== ACTIONS.CALENDAR.IS_EVENT_RUNNING
    })}
  >
    <div class="card">
      <div class="card-header">
        {props.action.type !== null && <i class={ACTION_ICON[props.action.type]} />}
        {props.action.type === null && <i class="ti ti-plus-circle" />}
        <div class="card-title">
          <i
            class={props.action.icon}
            style={{
              marginRight: '10px'
            }}
          />{' '}
          <Text id={`editScene.actions.${props.action.type}`} />
          {props.action.type === null && <Text id="editScene.newAction" />}
        </div>
        {props.highLightedActions && props.highLightedActions[`${props.columnIndex}:${props.index}`] && (
          <div class="card-status bg-blue" />
        )}
        <div class="card-options">
          {false && (
            <a class="card-options-collapse">
              <i class="ti ti-chevron-down" />
            </a>
          )}
          <a
            onClick={deleteActionFromColumn(props.columnIndex, props.index, props.deleteAction)}
            class="card-options-remove"
          >
            <i class="ti ti-x" />
          </a>
        </div>
      </div>
      <div class="card-body">
        {props.action.type === ACTIONS.TIME.DELAY && (
          <DelayActionParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === null && (
          <ChooseActionTypeParams
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.LIGHT.TURN_ON && (
          <TurnOnOffLightParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.LIGHT.TURN_OFF && (
          <TurnOnOffLightParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.SWITCH.TURN_ON && (
          <TurnOnOffSwitchParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.SWITCH.TURN_OFF && (
          <TurnOnOffSwitchParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.MESSAGE.SEND && (
          <SendMessageParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            actionsGroupsBefore={props.actionsGroupsBefore}
            variables={props.variables}
            triggersVariables={props.triggersVariables}
          />
        )}
        {props.action.type === ACTIONS.CONDITION.ONLY_CONTINUE_IF && (
          <OnlyContinueIfParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            actionsGroupsBefore={props.actionsGroupsBefore}
            variables={props.variables}
            setVariables={props.setVariables}
          />
        )}
        {props.action.type === ACTIONS.DEVICE.GET_VALUE && (
          <DeviceGetValueParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            variables={props.variables}
            setVariables={props.setVariables}
          />
        )}
        {props.action.type === ACTIONS.USER.SET_SEEN_AT_HOME && (
          <UserPresence
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.USER.CHECK_PRESENCE && (
          <CheckUserPresence
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.USER.SET_OUT_OF_HOME && (
          <UserPresence
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.HTTP.REQUEST && (
          <HttpRequest
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            setVariables={props.setVariables}
          />
        )}
        {props.action.type === ACTIONS.CONDITION.CHECK_TIME && (
          <CheckTime
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            setVariables={props.setVariables}
          />
        )}
        {props.action.type === ACTIONS.SCENE.START && (
          <StartSceneParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            variables={props.variables}
            setVariables={props.setVariables}
            scene={props.scene}
          />
        )}
        {props.action.type === ACTIONS.HOUSE.IS_EMPTY && (
          <HouseEmptyOrNotCondition
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.HOUSE.IS_NOT_EMPTY && (
          <HouseEmptyOrNotCondition
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.DEVICE.SET_VALUE && (
          <DeviceSetValue
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
          />
        )}
        {props.action.type === ACTIONS.CALENDAR.IS_EVENT_RUNNING && (
          <CalendarIsEventRunning
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
            variables={props.variables}
            setVariables={props.setVariables}
          />
        )}
      </div>
    </div>
  </div>
);

export default ActionCard;
