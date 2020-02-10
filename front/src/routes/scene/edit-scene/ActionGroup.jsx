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
            Add new action <i class="fe fe-plus" />
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
            <div class="row">
              {props.actions.map((action, index) => (
                <div class="col-lg-4">
                  <ActionCard
                    sceneParamsData={props.sceneParamsData}
                    action={action}
                    columnIndex={props.index}
                    index={index}
                    updateActionProperty={props.updateActionProperty}
                    highLightedActions={props.highLightedActions}
                    deleteAction={props.deleteAction}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ActionGroup;
