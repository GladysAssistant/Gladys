import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { useRef } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import cx from 'classnames';

import ActionCard from './ActionCard';
import style from './style.css';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { convertPathToText } from '../../scene/edit-scene/sceneUtils';

const ACTION_GROUP_TYPE_LEVEL = 'ACTION_GROUP_TYPE_LEVEL';

import EmptyDropZone from './EmptyDropZone';

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
          <h4 class="text-center card-title ">{convertPathToText(props.path, props.intl.dictionary)}</h4>

          <div class="card-options">
            <div class="mr-4 my-auto">
              <i class="fe fe-move" />
            </div>

            {!props.firstActionGroup && !props.lastActionGroup && (
              <button onClick={props.deleteThisActionGroup} class="btn btn-outline-danger">
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
                  />
                ))}
                {props.actions.length === 0 && (
                  <div class="col">
                    <EmptyDropZone moveCard={props.moveCard} path={props.path} />
                  </div>
                )}
              </div>

              {/* Add Action Button */}
              <div class="text-center mt-4">
                <button onClick={props.addActionToColumn} class="btn btn-sm btn-outline-primary">
                  <i class="fe fe-plus" /> <Text id="editScene.addActionButton">Add action</Text>
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

export default withIntlAsProp(ActionGroup);
