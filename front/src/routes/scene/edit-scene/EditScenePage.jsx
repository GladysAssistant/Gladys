import update from 'immutability-helper';
import cx from 'classnames';
import { useState } from 'preact/hooks';

import AutoScrollMobile from '../../../components/drag-and-drop/AutoScrollMobile';
import ActionGroup from './ActionGroup';
import TriggerGroup from './TriggerGroup';
import style from './style.css';
import Settings from './Settings';
import EditActions from './EditActions';
import { Text } from 'preact-i18n';

const EditScenePage = ({ children, ...props }) => {
  // The scene settings (name, description, icon, tags) are hidden by default
  // and open on demand from the header, to keep the scene visible right away
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  // Inserting a step between two existing steps = inserting a new action group,
  // then adding an empty action (the type picker) inside it
  const insertStepAfter = async index => {
    await props.addActionGroupAfter(index);
    await props.addAction(`${index + 1}`);
  };

  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <AutoScrollMobile position="top" box_type={props.actionsGroupTypes} />
          <div class={cx('container', style.pageContainer)}>
            <div class="mb-4">
              <div class="row justify-content-between">
                <div class="col-7 col-md-8">
                  <h1 class={cx('page-title', style.pageTitle)}>
                    <button onClick={props.goBack} class={cx('btn btn-secondary btn-sm', style.backButton)}>
                      <i class="fe fe-arrow-left" />
                    </button>
                    {props.scene.icon && (
                      <span class={style.sceneIconTile}>
                        <i class={`fe fe-${props.scene.icon}`} />
                      </span>
                    )}
                    <span class={style.sceneName}>{props.scene.name}</span>

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

                <div class="col-5 col-md-4">
                  <div class="text-right">
                    <button
                      onClick={settingsOpen ? closeSettings : openSettings}
                      className={cx('btn mb-0', style.headerActionBtn, {
                        'btn-secondary': settingsOpen,
                        'btn-outline-secondary': !settingsOpen
                      })}
                    >
                      <span class="d-none d-md-inline-block">
                        <Text id="editScene.settings" />
                      </span>{' '}
                      <i class="fe fe-settings" />
                    </button>
                  </div>
                </div>
                <div class="col-12 text-muted">{props.scene.description && <span>{props.scene.description}</span>}</div>
              </div>
            </div>
            <div>
              {props.error && (
                <div class="alert alert-danger">
                  <Text id="editScene.saveSceneError" />
                  {props.errorMessage && (
                    <div class="mt-2">
                      <small>{props.errorMessage}</small>
                    </div>
                  )}
                </div>
              )}
              {settingsOpen && (
                <div class="row">
                  <Settings
                    scene={props.scene}
                    updateSceneName={props.updateSceneName}
                    updateSceneDescription={props.updateSceneDescription}
                    updateSceneIcon={props.updateSceneIcon}
                    setTags={props.setTags}
                    tags={props.tags}
                    saving={props.saving}
                    closeSettings={closeSettings}
                  />
                </div>
              )}

              <div class="row">
                <div class="col-lg-12">
                  <div class={style.sectionHeader}>
                    <span class={cx(style.sectionTitle, style.sectionTitleWhen)}>
                      <Text id="editScene.whenSectionTitle" />
                    </span>
                    <span class={style.sectionSubtitle}>
                      <Text id="editScene.whenSectionSubtitle" />
                    </span>
                  </div>
                </div>
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
              <div class="row">
                <div class="col-lg-12">
                  <div class={style.sectionHeader}>
                    <span class={cx(style.sectionTitle, style.sectionTitleThen)}>
                      <Text id="editScene.thenSectionTitle" />
                    </span>
                    <span class={style.sectionSubtitle}>
                      <Text id="editScene.thenSectionSubtitle" />
                    </span>
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
                    lastActionGroup={index === props.scene.actions.length - 1}
                    variables={props.variables}
                    triggersVariables={props.triggersVariables}
                    setVariables={props.setVariables}
                  />
                </div>

                {parallelActions.length > 0 &&
                  index + 1 < props.scene.actions.length &&
                  props.scene.actions[index + 1].length > 0 && (
                    <div class={style.stepConnector}>
                      <button
                        onClick={() => insertStepAfter(index)}
                        class={style.stepInsertButton}
                        disabled={props.saving}
                        title=""
                      >
                        <i class="fe fe-plus" />
                      </button>
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
};

export default EditScenePage;
