import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { useRef } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import cx from 'classnames';

import ActionCard from './ActionCard';
import EmptyDropZone from './EmptyDropZone';
import style from './style.css';

const ACTION_GROUP_TYPE_LEVEL = 'ACTION_GROUP_TYPE_LEVEL';

const renderActionCard = (props, action, index) => (
  <ActionCard
    moveCard={props.moveCard}
    moveCardGroup={props.moveCardGroup}
    sceneParamsData={props.sceneParamsData}
    action={action}
    path={`${props.path}.${index}`}
    updateActionProperty={props.updateActionProperty}
    highLightedActions={props.highLightedActions}
    deleteActionGroup={props.deleteActionGroup}
    addAction={props.addAction}
    deleteAction={props.deleteAction}
    actionsGroupsBefore={props.actionsGroupsBefore}
    variables={props.variables}
    triggersVariables={props.triggersVariables}
    setVariables={props.setVariables}
    scene={props.scene}
    allActions={props.allActions}
    showParallelLink={props.actions.length === 1}
  />
);

const ActionGroupWithDragAndDrop = ({ children, ...props }) => {
  const pathLevel = props.path.split('.').length;
  const { path } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    // You can only drag & drop an action group of the same level
    type: `${ACTION_GROUP_TYPE_LEVEL}_${pathLevel}`,
    item: () => {
      return { path };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    // You can only drag & drop an action group of the same level
    accept: `${ACTION_GROUP_TYPE_LEVEL}_${pathLevel}`,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCardGroup(item.path, path);
    }
  });
  preview(drop(ref));

  // An empty group is an insertion point: a "add a step" button which is
  // also a drop zone for existing action cards
  if (props.actions.length === 0) {
    return (
      <div class="col">
        <EmptyDropZone moveCard={props.moveCard} path={props.path} onAddStep={props.addActionToColumn} />
      </div>
    );
  }

  // A group with a single action renders as a simple full-width step,
  // without any group chrome around it
  if (props.actions.length === 1) {
    return (
      <div class="col">
        <div class="row">{renderActionCard(props, props.actions[0], 0)}</div>
      </div>
    );
  }

  // A group with several actions renders as an explicit "at the same time" block
  return (
    <div class="col">
      <div
        ref={ref}
        class={cx('card user-select-none', style.parallelBlock, {
          [style.dropZoneActive]: isActive,
          [style.dropZoneDragging]: isDragging
        })}
      >
        <div class="card-status card-status-left bg-blue" />
        <div ref={drag} class="card-header cursor-pointer">
          <span class={cx(style.stepIconTile, style.typePickerIconBlue)}>
            <i class="fe fe-git-merge" />
          </span>
          <h4 class="card-title">
            <Text id="editScene.parallelBlockTitle" />
          </h4>

          <div class="card-options">
            <a class="cursor-pointer">
              <i class="fe fe-move mr-4" />
            </a>
            {!props.lastActionGroup && (
              <a onClick={props.deleteThisActionGroup} class="card-options-remove cursor-pointer">
                <i class="fe fe-x" />
              </a>
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
              <div class="row">{props.actions.map((action, index) => renderActionCard(props, action, index))}</div>

              <div class="text-center">
                <button onClick={props.addActionToColumn} class="btn btn-sm btn-outline-secondary">
                  <i class="fe fe-plus" /> <Text id="editScene.addParallelActionButton" />
                </button>
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
    this.props.addAction(this.props.path);
  };
  deleteThisActionGroup = () => {
    this.props.deleteActionGroup(this.props.path);
  };

  render(props, {}) {
    return (
      <ActionGroupWithDragAndDrop
        {...props}
        deleteActionGroup={props.deleteActionGroup}
        addActionToColumn={this.addActionToColumn}
        deleteThisActionGroup={this.deleteThisActionGroup}
      />
    );
  }
}

export default ActionGroup;
