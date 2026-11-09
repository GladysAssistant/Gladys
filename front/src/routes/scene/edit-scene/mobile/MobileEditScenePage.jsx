import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import RelativeTime from '../../../../components/device/RelativeTime';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import RunningStopButton from '../../RunningStopButton';
import Settings from '../Settings';
import DraftBanner from '../DraftBanner';
import TimelineRow from './TimelineRow';
import ActionSheet from './ActionSheet';
import TriggerSheet from './TriggerSheet';
import { getActionRowInfo, getTriggerRowInfo, collectActions, countChanges, isBlockAction } from './rowInfo';
import { ACTIONS } from '../../../../../../server/utils/constants';
import style from '../../mobile.css';
import dashboardStyle from '../../../dashboard/style.css';

// the app's mobile top bar gives way to the editor's own navigation bar (E.1)
const FOCUS_PAGE_BODY_CLASS = 'gladys-focus-page';

const ACTION_SHEET = 'action';
const TRIGGER_SHEET = 'trigger';
const MENU_SHEET = 'menu';
const SETTINGS_SHEET = 'settings';
const DELETE_SCENE_SHEET = 'delete-scene';

/**
 * @description The scene editor on a phone (docs/specs/scene-editor-mobile.md, E): the scene
 * reads as a timeline, each step, condition and trigger is edited in its own bottom sheet. All
 * the mutations are the shared ones of the editor (props, from edit-scene/index.js).
 */
class MobileEditScenePage extends Component {
  state = {
    // the open sheets, bottom to top: { kind, key }
    sheets: [],
    reorder: false
  };

  componentDidMount() {
    document.body.classList.add(FOCUS_PAGE_BODY_CLASS);
    // a scene just created from the list: its first need is a trigger (D.4)
    if (this.props.isNewScene) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('new');
      const search = urlParams.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
      if (this.props.scene.triggers.length === 0) {
        this.addTrigger();
      }
    }
  }

  componentWillUnmount() {
    document.body.classList.remove(FOCUS_PAGE_BODY_CLASS);
  }

  // ---------- sheets ----------

  openSheet = (kind, key) => {
    this.setState(prevState => ({
      sheets: prevState.sheets.filter(sheet => !(sheet.kind === kind && sheet.key === key)).concat([{ kind, key }])
    }));
  };

  closeSheet = (kind, key) => {
    this.setState(prevState => ({
      sheets: prevState.sheets.filter(sheet => !(sheet.kind === kind && sheet.key === key))
    }));
  };

  closeAllSheets = () => {
    this.setState({ sheets: [] });
  };

  getSheetDepth = (kind, key) =>
    this.state.sheets.findIndex(sheet => sheet.kind === kind && String(sheet.key) === String(key));

  // ---------- steps ----------

  addStep = async (containerPath = '') => {
    const path = await this.props.appendStep(containerPath);
    if (path) {
      this.openSheet(ACTION_SHEET, path);
    }
  };

  addStepAtEnd = () => this.addStep('');

  insertStepAfter = async groupIndex => {
    this.closeAllSheets();
    const path = await this.props.insertStepAfter(groupIndex);
    this.openSheet(ACTION_SHEET, path);
  };

  addParallelAction = async groupPath => {
    this.closeAllSheets();
    const path = await this.props.addParallelAction(groupPath);
    this.openSheet(ACTION_SHEET, path);
  };

  addCondition = async (blockPath, filter) => {
    const path = await this.props.addConditionToBlock(blockPath, filter);
    if (path) {
      this.openSheet(ACTION_SHEET, path);
    }
  };

  // closing the sheet of a step still without a type removes it: nothing is left half-created
  closeActionSheet = path => {
    this.closeSheet(ACTION_SHEET, path);
    this.props.cancelEmptyAction(path);
  };

  deleteAction = path => {
    this.closeAllSheets();
    this.props.deleteActionWithUndo(path);
  };

  // ---------- triggers ----------

  addTrigger = async () => {
    const index = await this.props.addTriggerAndGetIndex();
    this.openSheet(TRIGGER_SHEET, index);
  };

  closeTriggerSheet = index => {
    this.closeSheet(TRIGGER_SHEET, index);
    this.props.cancelEmptyTrigger(index);
  };

  deleteTrigger = index => {
    this.closeAllSheets();
    this.props.deleteTriggerWithUndo(index);
  };

  // ---------- menu ----------

  openMenu = () => this.openSheet(MENU_SHEET, MENU_SHEET);
  closeMenu = () => this.closeSheet(MENU_SHEET, MENU_SHEET);
  openSettings = () => this.setState({ sheets: [{ kind: SETTINGS_SHEET, key: SETTINGS_SHEET }] });
  closeSettings = () => this.closeSheet(SETTINGS_SHEET, SETTINGS_SHEET);
  askDeleteScene = () => this.setState({ sheets: [{ kind: DELETE_SCENE_SHEET, key: DELETE_SCENE_SHEET }] });
  closeDeleteScene = () => this.closeSheet(DELETE_SCENE_SHEET, DELETE_SCENE_SHEET);
  startReorder = () => this.setState({ sheets: [], reorder: true });
  stopReorder = () => this.setState({ reorder: false });

  // ---------- rendering helpers ----------

  getContext = () => ({
    dictionary: this.props.intl.dictionary,
    deviceFeatures: this.props.deviceFeatures,
    thermostatSchedules: this.props.thermostatSchedules,
    sceneIntegrations: this.props.sceneIntegrations,
    language: get(this.props, 'user.language') || 'en'
  });

  renderRow = (action, path, variant, extra = {}) => (
    <TimelineRow
      key={path}
      info={getActionRowInfo(action, path, this.getContext())}
      variant={variant}
      running={extra.running}
      onOpen={() => this.openSheet(ACTION_SHEET, path)}
      onDelete={() => this.deleteAction(path)}
      dataCy={`scene-step-row-${path}`}
    />
  );

  renderBranch = (blockPath, branch, groups, labelId) => {
    const branchPath = `${blockPath}.${branch}`;
    const rows = [];
    (groups || []).forEach((group, groupIndex) => {
      const groupPath = `${branchPath}.${groupIndex}`;
      // actions running at the same time inside a branch keep their group, as at the top level
      if (group.length > 1) {
        rows.push(this.renderParallelGroup(group, groupPath));
        return;
      }
      group.forEach((action, actionIndex) => {
        const path = `${groupPath}.${actionIndex}`;
        rows.push(
          isBlockAction(action) ? this.renderBlock(action, path, 'nested') : this.renderRow(action, path, 'nested')
        );
      });
    });
    const isElse = branch === 'else';
    return (
      <div key={branch}>
        <div class={cx(style.branchLabel, { [style.branchLabelElse]: isElse })}>
          <Text id={labelId} />
        </div>
        <div class={style.branchBody}>
          <span class={cx(style.branchRail, { [style.branchRailElse]: isElse })} aria-hidden="true" />
          <div class={style.branchRows}>
            {rows}
            {rows.length === 0 && (
              <span class={style.branchEmpty}>
                <Text id="editScene.mobile.noActionInBranch" />
              </span>
            )}
            <button
              type="button"
              class={style.linkButton}
              onClick={() => this.addStep(branchPath)}
              data-cy={`scene-add-to-${branchPath}`}
            >
              <i class="fe fe-plus" aria-hidden="true" />
              <Text id={`editScene.mobile.addTo.${branch}`} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderBlock = (action, path, variant, extra = {}) => {
    const isWhile = action.type === ACTIONS.CONDITION.WHILE;
    return (
      <div key={path} class={style.card}>
        {this.renderRow(action, path, 'flush', extra)}
        <div class={style.branch}>
          {this.renderBranch(path, 'then', action.then, isWhile ? 'editScene.mobile.repeat' : 'editScene.mobile.then')}
          {!isWhile && this.renderBranch(path, 'else', action.else, 'editScene.mobile.else')}
        </div>
      </div>
    );
  };

  // the conditions of an if/while block, in the block's sheet: one row each, opening its own
  // sheet above the block's one
  renderBlockConditions = blockPath => (conditions, filter) => (
    <div>
      <span class={style.sheetLabel}>
        <Text id="editScene.mobile.conditionsTitle" />
      </span>
      <div class={style.stack}>
        {conditions.map((condition, index) => this.renderRow(condition, `${blockPath}.if.${index}`, 'nested'))}
        {conditions.length === 0 && (
          <span class={style.branchEmpty}>
            <Text id="editScene.mobile.noCondition" />
          </span>
        )}
        <button
          type="button"
          class={style.linkButton}
          onClick={() => this.addCondition(blockPath, filter)}
          data-cy={`scene-add-condition-${blockPath}`}
        >
          <i class="fe fe-plus" aria-hidden="true" />
          <Text id="editScene.mobile.addCondition" />
        </button>
      </div>
      <p class={style.hint}>
        <Text id="editScene.mobile.conditionsAllRequired" />
      </p>
    </div>
  );

  // Actions running at the same time: one card, with its own "add a simultaneous action" control.
  // An if/while block inside keeps its branches.
  renderParallelGroup = (group, groupPath, isRunning = () => false) => (
    <div class={style.card} key={groupPath}>
      <div class={style.cardLabel}>
        <i class="fe fe-layers" aria-hidden="true" />
        <Text id="editScene.mobile.atTheSameTime" />
      </div>
      {group.map((action, actionIndex) => {
        const path = `${groupPath}.${actionIndex}`;
        const extra = { running: isRunning(actionIndex) };
        return (
          <div class={style.cardDivider} key={actionIndex}>
            {isBlockAction(action)
              ? this.renderBlock(action, path, 'flush', extra)
              : this.renderRow(action, path, 'flush', extra)}
          </div>
        );
      })}
      <button
        type="button"
        class={style.cardFooterButton}
        onClick={() => this.addParallelAction(groupPath)}
        data-cy={`scene-add-parallel-${groupPath}`}
      >
        <i class="fe fe-plus" aria-hidden="true" />
        <Text id="editScene.mobile.simultaneousAction" />
      </button>
    </div>
  );

  renderTimeline = () => {
    const { scene, highLightedActions } = this.props;
    // the trailing empty groups the data model keeps are not steps
    const steps = scene.actions
      .map((group, groupIndex) => ({ group, groupIndex }))
      .filter(({ group }) => group.length > 0);
    return steps.map(({ group, groupIndex }, stepIndex) => {
      const isLast = stepIndex === steps.length - 1;
      let content;
      if (group.length > 1) {
        content = this.renderParallelGroup(group, `${groupIndex}`, actionIndex =>
          Boolean(highLightedActions && highLightedActions[`${groupIndex}:${actionIndex}`])
        );
      } else {
        const action = group[0];
        const extra = { running: Boolean(highLightedActions && highLightedActions[`${groupIndex}:0`]) };
        content = isBlockAction(action)
          ? this.renderBlock(action, `${groupIndex}.0`, 'card', extra)
          : this.renderRow(action, `${groupIndex}.0`, 'card', extra);
      }
      return (
        <div class={style.timelineItem} key={groupIndex}>
          <div class={style.timelineRail} aria-hidden="true">
            <span class={style.timelineNumber}>{stepIndex + 1}</span>
            <span class={cx(style.timelineLine, { [style.timelineLineLast]: isLast })} />
          </div>
          <div class={style.timelineContent}>{content}</div>
        </div>
      );
    });
  };

  renderReorder = () => {
    const { scene } = this.props;
    const context = this.getContext();
    const lastStepIndex = scene.actions.length - 2;
    return (
      <div>
        <p class={style.hint}>
          <Text id="editScene.mobile.reorderHint" />
        </p>
        <div class={cx(style.card, style.reorderList)}>
          {scene.actions.map((group, groupIndex) => {
            if (group.length === 0) {
              return null;
            }
            const info =
              group.length > 1
                ? {
                    title: get(context.dictionary, 'editScene.mobile.atTheSameTime'),
                    summary: group
                      .map((action, index) => getActionRowInfo(action, `${groupIndex}.${index}`, context).title)
                      .join(' · ')
                  }
                : getActionRowInfo(group[0], `${groupIndex}.0`, context);
            return (
              <div class={style.reorderRow} key={groupIndex} data-cy={`scene-reorder-row-${groupIndex}`}>
                <Localizer>
                  <button
                    type="button"
                    class={cx(style.reorderButton, style.reorderButtonDanger)}
                    onClick={() =>
                      group.length > 1
                        ? this.props.deleteActionGroupWithUndo(`${groupIndex}`)
                        : this.props.deleteActionWithUndo(`${groupIndex}.0`)
                    }
                    aria-label={<Text id="editScene.mobile.deleteStep" />}
                  >
                    <i class="fe fe-minus-circle" />
                  </button>
                </Localizer>
                <span class={style.reorderNumber} aria-hidden="true">
                  {groupIndex + 1}
                </span>
                <span class={style.reorderText}>
                  <span class={style.rowTitle}>{info.title}</span>
                  {info.summary && <span class={style.rowSub}>{info.summary}</span>}
                </span>
                <Localizer>
                  <button
                    type="button"
                    class={style.reorderButton}
                    disabled={groupIndex === 0}
                    onClick={() => this.props.moveRootStep(groupIndex, -1)}
                    aria-label={<Text id="editScene.mobile.moveUp" />}
                    data-cy={`scene-reorder-up-${groupIndex}`}
                  >
                    <i class="fe fe-arrow-up" />
                  </button>
                </Localizer>
                <Localizer>
                  <button
                    type="button"
                    class={style.reorderButton}
                    disabled={groupIndex >= lastStepIndex}
                    onClick={() => this.props.moveRootStep(groupIndex, 1)}
                    aria-label={<Text id="editScene.mobile.moveDown" />}
                    data-cy={`scene-reorder-down-${groupIndex}`}
                  >
                    <i class="fe fe-arrow-down" />
                  </button>
                </Localizer>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  renderBottomBar = () => {
    const props = this.props;
    if (this.state.reorder) {
      return (
        <button type="button" class={cx(style.bigButton, style.bigButtonPrimary)} onClick={this.stopReorder}>
          <Text id="editScene.mobile.done" />
        </button>
      );
    }
    if (props.hasUnsavedChanges) {
      const changes = Math.max(1, countChanges(props.savedScene, props.scene));
      return (
        <div class={style.bottomBarRow}>
          <span class={style.dirtyLabel} data-cy="scene-unsaved-label">
            <span class={style.dirtyDot} aria-hidden="true" />
            <Text id="editScene.mobile.changes" plural={changes} fields={{ count: changes }} />
          </span>
          {/* while the scene runs, Stop stays at hand: Test would not start a second run */}
          {props.runningInfo ? (
            <RunningStopButton runningInfo={props.runningInfo} onStop={props.stopScene} small />
          ) : (
            <button
              type="button"
              class={cx(style.bigButton, style.bigButtonSoft)}
              onClick={props.saveAndStartScene}
              disabled={props.saving}
              data-cy="scene-test-button"
            >
              <Text id="editScene.mobile.test" />
            </button>
          )}
          <button
            type="button"
            class={cx(style.bigButton, style.bigButtonPrimary)}
            onClick={props.saveScene}
            disabled={props.saving}
            data-cy="scene-save-button"
          >
            {props.saving && <span class="spinner-border spinner-border-sm" aria-hidden="true" />}
            <Text id="editScene.saveButton" />
          </button>
        </div>
      );
    }
    if (props.runningInfo) {
      return <RunningStopButton runningInfo={props.runningInfo} onStop={props.stopScene} />;
    }
    return (
      <button
        type="button"
        class={cx(style.bigButton, style.bigButtonSoft)}
        onClick={props.startScene}
        disabled={props.saving}
        data-cy="scene-run-button"
      >
        <i class="fe fe-play" aria-hidden="true" />
        <Text id="editScene.mobile.runScene" />
      </button>
    );
  };

  renderError = () => {
    const props = this.props;
    if (!props.error) {
      return null;
    }
    return (
      <div class={style.errorBanner} role="alert">
        <Text id="editScene.saveSceneError" />
        {props.errorMessage && <div>{props.errorMessage}</div>}
        {props.errorMessageId && (
          <div>
            <Text id={props.errorMessageId} fields={props.errorMessageFields} />
          </div>
        )}
      </div>
    );
  };

  render(props, { reorder }) {
    const { scene } = props;
    const context = this.getContext();
    const triggers = scene.triggers || [];
    const hasSteps = scene.actions.some(group => group.length > 0);
    const isOpen = (kind, key) => this.getSheetDepth(kind, key) >= 0;
    const formProps = {
      scene,
      updateActionProperty: props.updateActionProperty,
      variables: props.variables,
      setVariables: props.setVariables,
      triggersVariables: props.triggersVariables,
      deleteAction: props.deleteAction,
      deleteActionGroup: props.deleteActionGroup,
      addAction: props.addAction,
      moveCard: props.moveCard,
      moveCardGroup: props.moveCardGroup,
      sceneIntegrations: props.sceneIntegrations,
      deviceFeatures: props.deviceFeatures,
      thermostatSchedules: props.thermostatSchedules
    };

    return (
      <div class="page">
        <div
          class={cx(
            'page-main',
            'glass-theme',
            dashboardStyle.dashboardBackground,
            dashboardStyle.glassScene,
            style.editorPage
          )}
        >
          <nav class={style.navBar}>
            {reorder ? (
              <>
                <div class={style.navSide} />
                <span class={cx(style.navTitle, style.navTitleText)}>
                  <Text id="editScene.mobile.reorderTitle" />
                </span>
                <div class={cx(style.navSide, style.navSideEnd)}>
                  <button type="button" class={style.navTextButton} onClick={this.stopReorder}>
                    <Text id="editScene.mobile.ok" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div class={style.navSide}>
                  <button
                    type="button"
                    class={style.navBack}
                    onClick={props.goBack}
                    data-cy="scene-back-button"
                    data-not-an-edit
                  >
                    <i class="fe fe-chevron-left" aria-hidden="true" />
                    <Text id="scene.title" />
                  </button>
                </div>
                <button type="button" class={style.navTitle} onClick={this.openSettings} data-not-an-edit>
                  {scene.icon && (
                    <span class={style.navTitleTile} aria-hidden="true">
                      <i class={`fe fe-${scene.icon}`} />
                    </span>
                  )}
                  <span class={style.navTitleText}>{scene.name}</span>
                </button>
                <div class={cx(style.navSide, style.navSideEnd)}>
                  <Localizer>
                    <button
                      type="button"
                      class={style.navIconButton}
                      onClick={this.openMenu}
                      data-not-an-edit
                      aria-label={<Text id="editScene.mobile.moreActions" />}
                      data-cy="scene-more-button"
                    >
                      <i class="fe fe-more-horizontal" />
                    </button>
                  </Localizer>
                </div>
              </>
            )}
          </nav>

          <div class={style.editorContent}>
            <DraftBanner draft={props.draftToRestore} onRestore={props.restoreDraft} onDiscard={props.discardDraft} />
            {reorder ? (
              this.renderReorder()
            ) : (
              <>
                <div class={style.statusLine}>
                  <span class={style.statusText}>
                    <span class={style.statusTitle}>
                      <Text id={scene.active ? 'editScene.mobile.sceneActive' : 'editScene.mobile.sceneDisabled'} />
                    </span>
                    <span class={style.statusSub}>
                      {scene.last_executed ? (
                        <>
                          <Text id="editScene.mobile.lastRun" />{' '}
                          <RelativeTime datetime={scene.last_executed} language={context.language} futureDisabled />
                        </>
                      ) : (
                        <Text id="editScene.mobile.neverRun" />
                      )}
                    </span>
                  </span>
                  <Localizer>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={scene.active ? 'true' : 'false'}
                      aria-label={<Text id="editScene.mobile.sceneActive" />}
                      class={style.switchButton}
                      onClick={props.switchActiveScene}
                      disabled={props.saving}
                      data-cy="scene-active-switch"
                      data-not-an-edit
                    >
                      <span class={cx(style.switchTrack, { [style.switchTrackOn]: scene.active })}>
                        <span class={style.switchKnob} />
                      </span>
                    </button>
                  </Localizer>
                </div>

                <div class={style.sectionHeader}>
                  <h2 class={cx(style.sectionTitle, style.sectionTitleWhen)}>
                    <Text id="editScene.whenSectionTitle" />
                  </h2>
                  <span class={style.sectionSubtitle}>
                    <Text id="editScene.mobile.whenSubtitle" />
                  </span>
                </div>
                <div class={style.stack}>
                  {triggers.map((trigger, index) => (
                    <div class={style.stack} key={index}>
                      {index > 0 && (
                        <div class={style.orSeparator}>
                          <span class={style.orPill}>
                            <Text id="editScene.orSeparator" />
                          </span>
                        </div>
                      )}
                      <TimelineRow
                        info={getTriggerRowInfo(trigger, context)}
                        variant="card"
                        onOpen={() => this.openSheet(TRIGGER_SHEET, index)}
                        onDelete={() => this.deleteTrigger(index)}
                        dataCy={`scene-trigger-row-${index}`}
                      />
                    </div>
                  ))}
                  {triggers.length === 0 ? (
                    <button
                      type="button"
                      class={cx(style.dashedButton, style.dashedButtonWhen)}
                      onClick={this.addTrigger}
                      data-cy="scene-add-trigger"
                    >
                      <i class="fe fe-plus" aria-hidden="true" />
                      <Text id="editScene.mobile.chooseTrigger" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      class={cx(style.linkButton, style.linkButtonWhen)}
                      onClick={this.addTrigger}
                      data-cy="scene-add-trigger"
                    >
                      <i class="fe fe-plus" aria-hidden="true" />
                      <Text id="editScene.mobile.orWhen" />
                    </button>
                  )}
                </div>

                <div class={style.sectionHeader}>
                  <h2 class={cx(style.sectionTitle, style.sectionTitleThen)}>
                    <Text id="editScene.thenSectionTitle" />
                  </h2>
                  <span class={style.sectionSubtitle}>
                    <Text id="editScene.mobile.thenSubtitle" />
                  </span>
                </div>
                {this.renderTimeline()}
                {hasSteps ? (
                  <div class={style.timelineEnd}>
                    <button
                      type="button"
                      class={style.dashedButton}
                      onClick={this.addStepAtEnd}
                      data-cy="scene-add-step"
                    >
                      <i class="fe fe-plus" aria-hidden="true" />
                      <Text id="editScene.addStepButton" />
                    </button>
                  </div>
                ) : (
                  <button type="button" class={style.dashedButton} onClick={this.addStepAtEnd} data-cy="scene-add-step">
                    <i class="fe fe-plus" aria-hidden="true" />
                    <Text id="editScene.mobile.addFirstStep" />
                  </button>
                )}
                {(hasSteps || triggers.length > 0) && (
                  <p class={style.hint}>
                    <Text id="editScene.mobile.swipeHint" />
                  </p>
                )}
              </>
            )}
          </div>

          {/* save, test, run, stop: none of them edits the scene (draft check, spec C.2) */}
          <div class={style.bottomBar} data-not-an-edit>
            {this.renderError()}
            {this.renderBottomBar()}
          </div>

          {props.toast && (
            <div class={style.toast} role="status" key={props.toast.id} data-cy="scene-toast">
              <span class={style.toastText}>
                <Text id={props.toast.textId} />
              </span>
              {props.toast.withUndo && (
                <button type="button" class={style.toastButton} onClick={props.undo} data-cy="scene-toast-undo">
                  <Text id="editScene.mobile.undo" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* one sheet per trigger and per action, mounted for their whole life (E.4) */}
        {triggers.map((trigger, index) => (
          <TriggerSheet
            key={`trigger-${props.structureVersion}-${index}`}
            trigger={trigger}
            index={index}
            open={isOpen(TRIGGER_SHEET, index)}
            info={getTriggerRowInfo(trigger, context)}
            updateTriggerProperty={props.updateTriggerProperty}
            variables={props.variables}
            setVariablesTrigger={props.setVariablesTrigger}
            sceneIntegrations={props.sceneIntegrations}
            onClose={() => this.closeTriggerSheet(index)}
            onDelete={() => this.deleteTrigger(index)}
          />
        ))}
        {collectActions(scene.actions).map(({ path, action }) => {
          const segments = path.split('.');
          const rootGroupIndex = parseInt(segments[0], 10);
          const isRootStep = segments.length === 2;
          const isCondition = segments[segments.length - 2] === 'if';
          const groupPath = segments.slice(0, -1).join('.');
          return (
            <ActionSheet
              key={`action-${props.structureVersion}-${path}`}
              {...formProps}
              action={action}
              path={path}
              isCondition={isCondition}
              open={isOpen(ACTION_SHEET, path)}
              depth={this.getSheetDepth(ACTION_SHEET, path)}
              info={getActionRowInfo(action, path, context)}
              actionsGroupsBefore={scene.actions.slice(0, rootGroupIndex)}
              renderConditions={this.renderBlockConditions(path)}
              onClose={() => this.closeActionSheet(path)}
              onDelete={() => this.deleteAction(path)}
              onInsertAfter={isRootStep ? () => this.insertStepAfter(rootGroupIndex) : undefined}
              onParallel={isCondition ? undefined : () => this.addParallelAction(groupPath)}
            />
          );
        })}

        <BottomSheet
          open={isOpen(MENU_SHEET, MENU_SHEET)}
          title={scene.name}
          onClose={this.closeMenu}
          dataCy="scene-menu-sheet"
        >
          <div class={cx(style.sheetActions, style.sheetActionsFirst)}>
            <button type="button" class={style.sheetAction} onClick={this.openSettings}>
              <i class="fe fe-edit-2" aria-hidden="true" />
              <Text id="editScene.mobile.settingsMenu" />
            </button>
            <button type="button" class={style.sheetAction} onClick={this.startReorder} disabled={!hasSteps}>
              <i class="fe fe-list" aria-hidden="true" />
              <Text id="editScene.mobile.reorderMenu" />
            </button>
            <button type="button" class={style.sheetAction} onClick={props.duplicateScene}>
              <i class="fe fe-copy" aria-hidden="true" />
              <Text id="editScene.duplicateButton" />
            </button>
          </div>
          <div class={style.sheetActions}>
            <button
              type="button"
              class={cx(style.sheetAction, style.sheetActionDanger)}
              onClick={this.askDeleteScene}
              data-cy="scene-menu-delete"
            >
              <i class="fe fe-trash-2" aria-hidden="true" />
              <Text id="editScene.mobile.deleteScene" />
            </button>
          </div>
        </BottomSheet>

        <BottomSheet
          open={isOpen(SETTINGS_SHEET, SETTINGS_SHEET)}
          title={get(context.dictionary, 'editScene.mobile.settingsMenu')}
          size="full"
          onClose={this.closeSettings}
          onOk={this.closeSettings}
          dataCy="scene-settings-sheet"
        >
          <div class={style.sheetForm}>
            <Settings
              bare
              scene={scene}
              updateSceneName={props.updateSceneName}
              updateSceneDescription={props.updateSceneDescription}
              updateSceneIcon={props.updateSceneIcon}
              setTags={props.setTags}
              tags={props.tags}
              saving={props.saving}
            />
          </div>
        </BottomSheet>

        <BottomSheet
          open={isOpen(DELETE_SCENE_SHEET, DELETE_SCENE_SHEET)}
          title={get(context.dictionary, 'editScene.mobile.deleteSceneTitle')}
          onClose={this.closeDeleteScene}
          dataCy="scene-delete-sheet"
        >
          <p class={style.sheetText}>
            <Text id="editScene.mobile.deleteSceneText" fields={{ name: scene.name }} />
          </p>
          <div class={style.sheetButtons}>
            <button
              type="button"
              class={cx(style.bigButton, style.bigButtonDanger)}
              onClick={props.deleteScene}
              disabled={props.saving}
              data-cy="scene-delete-confirm"
            >
              <Text id="editScene.mobile.deleteForever" />
            </button>
            <button type="button" class={cx(style.bigButton, style.bigButtonNeutral)} onClick={this.closeDeleteScene}>
              <Text id="editScene.cancelButton" />
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  }
}

export default connect('user', {})(withIntlAsProp(MobileEditScenePage));
