import update from 'immutability-helper';
import cx from 'classnames';

import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import ActionGroup from './ActionGroup';
import TriggerGroup from './TriggerGroup';
import style from './style.css';
import Settings from './Settings';
import EditActions from './EditActions';
import { Text } from 'preact-i18n';

const EditScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <AutoScrollMobile position="top" box_type={props.actionsGroupTypes} />
        <div class="container mb-8">
          <div class="mb-4">
            <div class="row justify-content-between">
              <div class="col-8">
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
              </div>

              <div class="col-4">
                {props.askDeleteScene && (
                  <div class="d-none d-md-flex flex-column flex-lg-row align-items-center text-right">
                    <div class="ml-auto mb-2">
                      <Text id="editScene.deleteText" />
                    </div>
                    <div>
                      <button onClick={props.deleteScene} className="btn btn-outline-danger ml-2 mb-2">
                        <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
                      </button>
                      <button onClick={props.cancelDeleteCurrentScene} className="btn btn-outline-secondary ml-2 mb-2">
                        <Text id="editScene.cancelButton" /> <i class="fe fe-slash" />
                      </button>
                    </div>
                  </div>
                )}

                {!props.askDeleteScene && (
                  <div class="text-right">
                    <button onClick={props.duplicateScene} className="btn btn-outline-primary mb-0 mb-sm-2 mb-lg-0">
                      <span class="d-none d-md-inline-block">
                        <Text id="editScene.duplicateButton" />
                      </span>{' '}
                      <i class="fe fe-copy" />
                    </button>
                    <button
                      onClick={props.askDeleteCurrentScene}
                      className="btn btn-outline-danger ml-2 mb-0 mb-sm-2 mb-lg-0"
                    >
                      <span class="d-none d-md-inline-block">
                        <Text id="editScene.deleteButton" />
                      </span>{' '}
                      <i class="fe fe-trash" />
                    </button>
                  </div>
                )}
              </div>
              <div class="col-12 text-muted">{props.scene.description && <span>{props.scene.description}</span>}</div>

              {/* Mobile delete confirmation - only visible on small screens */}
              {props.askDeleteScene && (
                <div class="col-12 d-md-none mt-3">
                  <div class="d-flex flex-column align-items-center text-center">
                    <div class="mb-2">
                      <Text id="editScene.deleteText" />
                    </div>
                    <div>
                      <button onClick={props.deleteScene} className="btn btn-outline-danger mx-1 mb-2">
                        <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
                      </button>
                      <button onClick={props.cancelDeleteCurrentScene} className="btn btn-outline-secondary mx-1 mb-2">
                        <Text id="editScene.cancelButton" /> <i class="fe fe-slash" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  allActions={props.scene.actions}
                  deleteAction={props.deleteAction}
                  updateSelectedNewAction={props.updateSelectedNewAction}
                  updateActionProperty={props.updateActionProperty}
                  highLightedActions={props.highLightedActions}
                  sceneParamsData={props.sceneParamsData}
                  scene={props.scene}
                  index={index}
                  path={`${index}`}
                  saving={props.saving}
                  actionsGroupsBefore={update(props.scene.actions, {
                    $splice: [[index, props.scene.actions.length - index]]
                  })}
                  firstActionGroup={index === 0}
                  lastActionGroup={index === props.scene.actions.length - 1}
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
          <EditActions {...props} />
        </div>
        <AutoScrollMobile position="bottom" box_type={props.actionsGroupTypes} />
      </div>
    </div>
  </div>
);

export default EditScenePage;
