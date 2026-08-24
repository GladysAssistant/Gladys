import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';

import ActionCard from './ActionCard';
import EmptyDropZone from './EmptyDropZone';
import { startStepDrag, moveStepWithKeyboard } from './stepDrag';
import style from './style.css';

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
    columnIndex={props.index}
    index={index}
    isSequentialStep={props.actions.length === 1}
    showParallelLink={props.actions.length === 1}
  />
);

const ActionGroupContent = ({ children, ...props }) => {
  const { path } = props;
  const groupIndex = parseInt(path.split('.').pop(), 10);

  // An empty group is an insertion point: a "add a step" button which also
  // adopts a parallel card dropped on it (the card becomes its own step)
  if (props.actions.length === 0) {
    return (
      <div class="col">
        <EmptyDropZone path={props.path} onAddStep={props.addActionToColumn} />
      </div>
    );
  }

  // A group with a single action renders as a simple full-width step,
  // without any group chrome around it
  if (props.actions.length === 1) {
    return (
      <div class="col" data-step-slot data-group-index={groupIndex}>
        <div class="row">{renderActionCard(props, props.actions[0], 0)}</div>
      </div>
    );
  }

  const onHandlePointerDown = event => startStepDrag(event, { groupPath: path, moveCardGroup: props.moveCardGroup });
  const onHandleKeyDown = event => moveStepWithKeyboard(event, { groupPath: path, moveCardGroup: props.moveCardGroup });

  // A group with several actions renders as an explicit "at the same time" block
  return (
    <div class="col" data-step-slot data-group-index={groupIndex}>
      <div class={cx('card user-select-none', style.stepCard, style.parallelBlock)}>
        <div class={cx('card-header', style.stepCardHeader)}>
          <span class={cx(style.stepIconTile, style.typePickerIconBlue)}>
            <i class="fe fe-git-merge" />
          </span>
          {/* a step heading, not a widget label: the theme shrinks .card-title
              to a 12px uppercase micro-label, which is the dashboard grammar */}
          <span class={style.stepLabel} data-step-label>
            <Text id="editScene.parallelBlockTitle" />
          </span>

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
            {!props.lastActionGroup && (
              <Localizer>
                <button
                  type="button"
                  onClick={props.deleteThisActionGroup}
                  class={cx('card-options-remove', style.cardOptionButton)}
                  aria-label={<Text id="editScene.deleteStepButton" />}
                >
                  <i class="fe fe-x" />
                </button>
              </Localizer>
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
              <div
                class="row"
                data-parallel-drop
                data-group-path={path}
                data-drop-active-class={style.parallelDropActive}
              >
                {props.actions.map((action, index) => renderActionCard(props, action, index))}
              </div>

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
      <ActionGroupContent
        {...props}
        deleteActionGroup={props.deleteActionGroup}
        addActionToColumn={this.addActionToColumn}
        deleteThisActionGroup={this.deleteThisActionGroup}
      />
    );
  }
}

export default ActionGroup;
