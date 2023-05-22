import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import ActionCard from './ActionCard';

import EmptyDropZone from './EmptyDropZone';

class ActionGroup extends Component {
  addActionToColumn = () => {
    this.props.addAction(this.props.index, 'new');
  };
  deleteActionGroup = () => {
    this.props.deleteActionGroup(this.props.index);
  };

  render(props, {}) {
    const firstActionGroup = props.index === 0;
    const lastActionGroup = props.index === props.scene.actions.length - 1;

    return (
      <div class="col">
        <div class="card">
          <div class="card-status bg-green" />
          <div class="card-header">
            <h4 class="text-center card-title ">
              <Text id="global.listItem" fields={{ index: props.index + 1 }} />
            </h4>
            <div class="card-options">
              <button onClick={this.addActionToColumn} class="btn btn-outline-primary">
                <span class="d-none d-sm-inline-block">
                  <Text id="editScene.addActionButton" />
                </span>{' '}
                <i class="fe fe-plus" />
              </button>
              {!firstActionGroup && !lastActionGroup && (
                <button onClick={this.deleteActionGroup} class="btn btn-outline-danger ml-2">
                  <i class="fe fe-trash-2" />
                </button>
              )}
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
                <div class="row">
                  {props.actions.map((action, index) => (
                    <ActionCard
                      moveCard={props.moveCard}
                      sceneParamsData={props.sceneParamsData}
                      action={action}
                      columnIndex={props.index}
                      index={index}
                      y={props.y}
                      x={index}
                      updateActionProperty={props.updateActionProperty}
                      highLightedActions={props.highLightedActions}
                      deleteAction={props.deleteAction}
                      actionsGroupsBefore={props.actionsGroupsBefore}
                      variables={props.variables}
                      triggersVariables={props.triggersVariables}
                      setVariables={props.setVariables}
                      scene={props.scene}
                    />
                  ))}
                  {props.actions.length === 0 && (
                    <div class="col">
                      <EmptyDropZone moveCard={props.moveCard} y={props.y} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ActionGroup;
