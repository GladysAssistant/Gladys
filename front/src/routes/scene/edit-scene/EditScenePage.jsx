import { Text, Localizer } from 'preact-i18n';
import update from 'immutability-helper';
import cx from 'classnames';

import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import ActionGroup from './ActionGroup';
import SceneActionsDropdown from './SceneActionsDropdown';
import TriggerGroup from './TriggerGroup';
import style from './style.css';

const ACTION_CARD_TYPE = 'ACTION_CARD_TYPE';

const EditScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <AutoScrollMobile position="top" box_type={ACTION_CARD_TYPE} />
        <div class="container">
          <div class="mb-1">
            <div class="d-flex justify-content-between flex-column flex-md-row align-items-md-center align-items-start">
              <div>
                <h1 class="page-title">
                  {props.isNameEditable ? (
                    <form onSubmit={props.saveScene}>
                      <div class="input-group">
                        <Localizer>
                          <input
                            type="text"
                            class="form-control form-control-sm "
                            onChange={props.updateSceneName}
                            value={props.scene.name}
                            ref={props.setNameInputRef}
                            placeholder={<Text id="editScene.editNamePlaceholder" />}
                          />
                        </Localizer>
                        <div class="input-group-append">
                          <button class="btn btn-primary btn-sm" onClick={props.saveScene}>
                            <Text id="global.save" />
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <span onClick={props.toggleIsNameEditable}>
                      {props.scene.name}{' '}
                      <small>
                        <i class="fe fe-edit-3" />
                      </small>
                    </span>
                  )}
                  <label class="custom-switch m-0 ml-4">
                    <input
                      type="checkbox"
                      name="active"
                      value="1"
                      class="custom-switch-input"
                      checked={props.scene.active}
                      onClick={props.switchActiveScene}
                    />
                    <span class="custom-switch-indicator" />
                  </label>
                </h1>

                <span class="text-muted">
                  Déclenchement de l'arossage le week-end <i class="fe fe-edit-3" />
                </span>
              </div>
              <div class="mt-2 mt-md-0">
                <button onClick={props.startScene} class="btn btn-primary">
                  <span class="d-none d-sm-inline-block">
                    <Text id="editScene.startButton" />
                  </span>{' '}
                  <i class="fe fe-play" />
                </button>
                <button onClick={props.saveScene} disabled={props.saving} class="btn btn-success ml-2">
                  <span class="d-none d-sm-inline-block">
                    <Text id="editScene.saveButton" />
                  </span>{' '}
                  <i class="fe fe-save" />
                </button>
                <SceneActionsDropdown duplicateScene={props.duplicateScene} deleteScene={props.deleteScene} />
              </div>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col"></div>
          </div>
          <div>
            {props.error && (
              <div class="alert alert-danger">
                <Text id="editScene.saveSceneError" />
              </div>
            )}
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
        <AutoScrollMobile position="bottom" box_type={ACTION_CARD_TYPE} />
      </div>
    </div>
  </div>
);

export default EditScenePage;
