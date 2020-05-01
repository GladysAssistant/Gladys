import { h } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import ActionCard from './ActionCard';

const addActionToColumn = (columnIndex, addAction) => () => {
  addAction(columnIndex, 'new');
};

const ActionGroup = ({ children, ...props }) => (
  <div class="col">
    <div class="card">
      <div class="card-status bg-green" />
      <div class="card-header">
        <h4 class="text-center card-title ">{props.index + 1}.</h4>
        <div class="card-options">
          <button onClick={addActionToColumn(props.index, props.addAction)} class="btn btn-outline-primary">
            <Text id="editScene.addActionButton" /> <i class="fe fe-plus" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.saving
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.actions && props.actions.length > 0 && (
              <div class="alert alert-info">
                <Text id="editScene.actionsDescription" />
              </div>
            )}
            {props.actions && props.actions.length === 0 && (
              <div class="text-center">
                <Text id="editScene.noActionsYet" />
              </div>
            )}
            <div class="row">
              {props.actions.map((action, index) => (
                <ActionCard
                  sceneParamsData={props.sceneParamsData}
                  action={action}
                  columnIndex={props.index}
                  index={index}
                  updateActionProperty={props.updateActionProperty}
                  highLightedActions={props.highLightedActions}
                  deleteAction={props.deleteAction}
                  actionsGroupsBefore={props.actionsGroupsBefore}
                  variables={props.variables}
                  setVariables={props.setVariables}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ActionGroup;
