import update from 'immutability-helper';
import cx from 'classnames';

import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import ActionGroup from './ActionGroup';
import SceneActionsDropdown from './SceneActionsDropdown';
import TriggerGroup from './TriggerGroup';
import style from './style.css';
import Settings from './Settings';
import { Text } from 'preact-i18n';

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';
const ACTION_GROUP_TYPE = 'ACTION_GROUP_TYPE';

const EditScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <AutoScrollMobile position="top" box_type={[ACTION_CARD_TYPE, ACTION_GROUP_TYPE]} />
        <div class="container">
          <div class="mb-4">
            <div class="d-flex justify-content-between flex-column flex-lg-row align-items-lg-center align-items-start">
              <div>
                <h1 class="page-title">
                  <span>{props.scene.name}</span>

                  <label className="custom-switch m-0 ml-4">
                    <input
                      type="checkbox"
                      name="active"
                      value="1"
                      className="custom-switch-input"
                      checked={props.scene.active}
                      onClick={props.switchActiveScene}
                    />
                    <span class="custom-switch-indicator" />
                  </label>
                </h1>
                <span class="text-muted">{props.scene.description && <span>{props.scene.description}</span>}</span>
              </div>

              <div class="mt-2 mt-lg-0">
                <button onClick={props.startScene} className="btn btn-primary">
                  <span class="d-none d-sm-inline-block">
                    <Text id="editScene.startButton" />
                  </span>{' '}
                  <i class="fe fe-play" />
                </button>
                <button onClick={props.saveScene} disabled={props.saving} className="btn btn-success ml-2">
                  <span class="d-none d-sm-inline-block">
                    <Text id="editScene.saveButton" />
                  </span>{' '}
                  <i class="fe fe-save" />
                </button>
                <SceneActionsDropdown duplicateScene={props.duplicateScene} deleteScene={props.deleteScene} />
              </div>
            </div>
          </div>
          <div>
            {props.error && (
              <div class="alert alert-danger">
                <Text id="editScene.saveSceneError" />
              </div>
            )}
            <div class="row">
              <Settings
                scene={props.scene}
                updateSceneName={props.updateSceneName}
                updateSceneDescription={props.updateSceneDescription}
                updateSceneIcon={props.updateSceneIcon}
                setTags={props.setTags}
                tags={props.tags}
                saving={props.saving}
              />
            </div>

            <div class="row">
              <TriggerGroup
                triggers={props.scene.triggers}
                addTrigger={props.addTrigger}
                deleteTrigger={props.deleteTrigger}
                updateTriggerProperty={props.updateTriggerProperty}
                saving={props.saving}
                variables={props.variables}
                setVariablesTrigger={props.setVariablesTrigger}
              />
            </div>
            <div class={cx('row mb-4', style.arrowDown)}>
              <div class="col-lg-12">
                <div class="text-center">
                  <i class="fe fe-arrow-down" />
                </div>
              </div>
            </div>
          </div>

          {props.scene.actions.map((parallelActions, index) => (
            <div>
              <div class="row">
                <ActionGroup
                  moveCard={props.moveCard}
                  moveCardGroup={props.moveCardGroup}
                  addAction={props.addAction}
                  deleteActionGroup={props.deleteActionGroup}
                  actions={parallelActions}
                  deleteAction={props.deleteAction}
                  updateSelectedNewAction={props.updateSelectedNewAction}
                  updateActionProperty={props.updateActionProperty}
                  highLightedActions={props.highLightedActions}
                  sceneParamsData={props.sceneParamsData}
                  scene={props.scene}
                  index={index}
                  y={index}
                  saving={props.saving}
                  actionsGroupsBefore={update(props.scene.actions, {
                    $splice: [[index, props.scene.actions.length - index]]
                  })}
                  variables={props.variables}
                  triggersVariables={props.triggersVariables}
                  setVariables={props.setVariables}
                />
              </div>
              {index + 1 < props.scene.actions.length && (
                <div class={cx('row mb-4', style.arrowDown)}>
                  <div class="col-lg-12">
                    <div class="text-center">
                      <i class="fe fe-arrow-down" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <AutoScrollMobile position="bottom" box_type={[ACTION_CARD_TYPE, ACTION_GROUP_TYPE]} />
      </div>
    </div>
  </div>
);

export default EditScenePage;
