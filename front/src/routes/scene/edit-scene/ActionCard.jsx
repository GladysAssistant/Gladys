import { h } from 'preact';
import { Text } from 'preact-i18n';
import { ACTIONS } from '../../../../../server/utils/constants';

// Actions cards
import ChooseActionTypeParams from './actions/ChooseActionTypeCard';
import DelayActionParams from './actions/DelayActionParams';
import DeviceGetValueParams from './actions/DeviceGetValueParams';
import SendMessageParams from './actions/SendMessageParams';
import OnlyContinueIfParams from './actions/only-continue-if/OnlyContinueIfParams';
import TurnOnOffLightParams from './actions/TurnOnOffLightParams';

const deleteActionFromColumn = (columnIndex, rowIndex, deleteAction) => () => {
  deleteAction(columnIndex, rowIndex);
};

const ACTION_ICON = {
  [ACTIONS.LIGHT.TURN_ON]: 'fe fe-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'fe fe-toggle-left',
  [ACTIONS.TIME.DELAY]: 'fe fe-clock',
  [ACTIONS.MESSAGE.SEND]: 'fe fe-message-square',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'fe fe-shuffle',
  [ACTIONS.DEVICE.GET_VALUE]: 'fe fe-refresh-cw'
};

const ActionCard = ({ children, ...props }) => (
  <div class={props.action.type === ACTIONS.CONDITION.ONLY_CONTINUE_IF ? 'col-lg-12' : 'col-lg-4'}>
    <div class="card">
      <div class="card-header">
        {props.action.type !== null && <i class={ACTION_ICON[props.action.type]} />}
        {props.action.type === null && <i class="fe fe-plus-circle" />}
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
              <i class="fe fe-chevron-down" />
            </a>
          )}
          <a
            onClick={deleteActionFromColumn(props.columnIndex, props.index, props.deleteAction)}
            class="card-options-remove"
          >
            <i class="fe fe-x" />
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
        {props.action.type === ACTIONS.MESSAGE.SEND && (
          <SendMessageParams
            action={props.action}
            columnIndex={props.columnIndex}
            index={props.index}
            updateActionProperty={props.updateActionProperty}
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
      </div>
    </div>
  </div>
);

export default ActionCard;
