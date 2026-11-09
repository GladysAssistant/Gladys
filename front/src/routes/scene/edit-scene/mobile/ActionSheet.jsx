import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import ACTION_COMPONENTS from '../actionComponents';
import { isBlockAction } from './rowInfo';
import style from '../../mobile.css';

/**
 * @description The sheet of one step or condition of the mobile editor
 * (docs/specs/scene-editor-mobile.md, E.4). It is mounted for the whole life of the step, open or
 * not: the parameter form registers the step's variables and initializes the step when it mounts.
 * A step without a type shows the type picker, filling the sheet; picking a type turns the same
 * sheet into the parameter form.
 */
class ActionSheet extends Component {
  render(props) {
    const { action, path, open, depth, info, isCondition } = props;
    const FormComponent = ACTION_COMPONENTS[action.type];
    const hasType = action.type !== null;
    const isBlock = isBlockAction(action);
    return (
      <BottomSheet
        open={open}
        keepMounted
        depth={depth}
        title={info.title}
        size={hasType ? undefined : 'full'}
        onClose={props.onClose}
        onOk={hasType ? props.onClose : undefined}
        dataCy={`scene-step-sheet-${path}`}
      >
        {FormComponent && (
          <div class={style.sheetForm}>
            <FormComponent
              action={action}
              allActions={props.scene.actions}
              path={path}
              updateActionProperty={props.updateActionProperty}
              variables={props.variables}
              setVariables={props.setVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              triggersVariables={props.triggersVariables}
              deleteAction={props.deleteAction}
              deleteActionGroup={props.deleteActionGroup}
              addAction={props.addAction}
              moveCard={props.moveCard}
              moveCardGroup={props.moveCardGroup}
              scene={props.scene}
              sceneIntegrations={props.sceneIntegrations}
              deviceFeatures={props.deviceFeatures}
              thermostatSchedules={props.thermostatSchedules}
              autoFocusSearch={open && !hasType}
              fill
              hideBranches
              renderConditions={isBlock ? props.renderConditions : undefined}
            />
          </div>
        )}
        {hasType && (
          <div class={style.sheetActions}>
            {props.onParallel && !isBlock && !isCondition && (
              <button type="button" class={style.sheetAction} onClick={props.onParallel}>
                <i class="fe fe-layers" aria-hidden="true" />
                <Text id="editScene.mobile.addSimultaneousAction" />
              </button>
            )}
            {props.onInsertAfter && (
              <button type="button" class={style.sheetAction} onClick={props.onInsertAfter}>
                <i class="fe fe-plus" aria-hidden="true" />
                <Text id="editScene.mobile.insertStepAfter" />
              </button>
            )}
            <button
              type="button"
              class={cx(style.sheetAction, style.sheetActionDanger)}
              onClick={props.onDelete}
              data-cy={`scene-step-sheet-delete-${path}`}
            >
              <i class="fe fe-trash-2" aria-hidden="true" />
              <Text id={isCondition ? 'editScene.mobile.deleteCondition' : 'editScene.mobile.deleteStep'} />
            </button>
          </div>
        )}
      </BottomSheet>
    );
  }
}

export default ActionSheet;
