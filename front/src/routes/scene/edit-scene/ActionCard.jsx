import { h } from 'preact';
import { Text } from 'preact-i18n';
import DelayActionParams from './actions/DelayActionParams';
import TurnOnLightParams from './actions/TurnOnLightParams';
import SendMessageParams from './actions/SendMessageParams';
import ChooseActionTypeParams from './actions/ChooseActionTypeCard';

const deleteActionFromColumn = (columnIndex, rowIndex, deleteAction) => () => {
  deleteAction(columnIndex, rowIndex);
};

const ACTION_ICON = {
  'light.turn-on': 'fe fe-sun',
  delay: 'fe fe-clock',
  'message.send': 'fe fe-message-square'
};

const ActionCard = ({ children, ...props }) => (
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
      {props.action.type === 'delay' && (
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
      {props.action.type === 'light.turn-on' && (
        <TurnOnLightParams
          action={props.action}
          columnIndex={props.columnIndex}
          index={props.index}
          updateActionProperty={props.updateActionProperty}
        />
      )}
      {props.action.type === 'message.send' && (
        <SendMessageParams
          action={props.action}
          columnIndex={props.columnIndex}
          index={props.index}
          updateActionProperty={props.updateActionProperty}
        />
      )}
    </div>
  </div>
);

export default ActionCard;
