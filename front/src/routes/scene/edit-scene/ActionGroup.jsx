import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { useRef } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';

import cx from 'classnames';
import ActionCard from './ActionCard';
import style from './style.css';

const ACTION_GROUP_TYPE = 'ACTION_GROUP_TYPE';

import EmptyDropZone from './EmptyDropZone';

const ActionGroupWithDragAndDrop = ({ children, ...props }) => {
  const { index } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ACTION_GROUP_TYPE,
    item: () => {
      return { index };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: ACTION_GROUP_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCardGroup(item.index, index);
    }
  });
  preview(drop(ref));
  return (
    <div class="col">
      <div
        ref={ref}
        class={cx('card cursor-pointer user-select-none', {
          [style.dropZoneActive]: isActive,
          [style.dropZoneDragging]: isDragging
        })}
      >
        <div class="card-status bg-green" />
        <div ref={drag} class="card-header">
          <h4 class="text-center card-title ">
            <Text id="global.listItem" fields={{ index: props.index + 1 }} />
          </h4>

          <div class="card-options">
            <div class="mr-4 my-auto">
              <i class="fe fe-move" />
            </div>

            <button onClick={props.addActionToColumn} class="btn btn-outline-primary">
              <span class="d-none d-sm-inline-block">
                <Text id="editScene.addActionButton" />
              </span>{' '}
              <i class="fe fe-plus" />
            </button>
            {!props.firstActionGroup && !props.lastActionGroup && (
              <button onClick={props.deleteActionGroup} class="btn btn-outline-danger ml-2">
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
};

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
      <ActionGroupWithDragAndDrop
        {...props}
        firstActionGroup={firstActionGroup}
        lastActionGroup={lastActionGroup}
        addActionToColumn={this.addActionToColumn}
        deleteActionGroup={this.deleteActionGroup}
      />
    );
  }
}

export default ActionGroup;
