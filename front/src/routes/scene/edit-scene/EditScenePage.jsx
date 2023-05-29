import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import ActionGroup from './ActionGroup';
import TriggerGroup from './TriggerGroup';
import update from 'immutability-helper';

const EditScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title mr-5">
              <Link href="/dashboard/scene" class="btn btn-secondary btn-sm btn-block">
                <Text id="global.backButton" />
              </Link>
            </h1>
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
                <span onClick={props.toggleIsNameEditable}>{props.scene.name}</span>
              )}
            </h1>
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
            <div class="page-options d-flex">
              <button onClick={props.startScene} class="btn btn-sm btn-primary ml-2">
                <Text id="editScene.startButton" /> <i class="fe fe-play" />
              </button>
              <button onClick={props.duplicateScene} disabled={props.saving} className="btn btn-sm btn-warning ml-2">
                <Text id="editScene.duplicateButton" /> <i className="fe fe-copy" />
              </button>
              <button onClick={props.saveScene} disabled={props.saving} class="btn btn-sm btn-success ml-2">
                <Text id="editScene.saveButton" /> <i class="fe fe-save" />
              </button>
              <button onClick={props.deleteScene} class="btn btn-sm btn-danger ml-2">
                <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
              </button>
            </div>
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
            <div class="row h1">
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
                  addAction={props.addAction}
                  actions={parallelActions}
                  deleteAction={props.deleteAction}
                  updateSelectedNewAction={props.updateSelectedNewAction}
                  updateActionProperty={props.updateActionProperty}
                  highLightedActions={props.highLightedActions}
                  sceneParamsData={props.sceneParamsData}
                  scene={props.scene}
                  index={index}
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
                <div class="row h1">
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
      </div>
    </div>
  </div>
);

export default EditScenePage;
