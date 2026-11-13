import { h } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';
import { useCallback, useState } from 'preact/hooks';

import style from './style.css';
import { ACTIONS } from '../../../../../server/utils/constants';
import { ACTION_ICON, ACTION_COLOR, COLOR_CLASS } from './typesCatalog';
import {
  getGroupPath,
  startStepDrag,
  startParallelCardDrag,
  startConditionDrag,
  moveStepWithKeyboard,
  moveParallelCardWithKeyboard,
  moveConditionWithKeyboard
} from './stepDrag';
import { getActionSummary } from './summary';
import withIntlAsProp from '../../../utils/withIntlAsProp';

import ACTION_COMPONENTS from './actionComponents';
import { SCENE_DECLARATION_KINDS, getSceneDeclarationTitle } from './sceneIntegrations';

const ActionCard = ({ children, ...props }) => {
  const { path, deleteAction, addAction, moveCard, moveCardGroup } = props;
  const groupPath = getGroupPath(path);
  const cardIndex = parseInt(path.split('.').pop(), 10);
  // The conditions of an if/while block are a flat list, not a group of actions
  const isCondition = path.includes('if');
  const isSequentialStep = props.isSequentialStep && !isCondition;
  // A card of an "at the same time" block: it moves on its own, while a
  // sequential step moves as a whole group
  const isParallelMember = !isCondition && !isSequentialStep;

  // Structural conditions embed their own action groups: they cannot be collapsed
  const isStructuralCondition =
    props.action.type === ACTIONS.CONDITION.IF_THEN_ELSE || props.action.type === ACTIONS.CONDITION.WHILE;
  // A new action starts expanded (the type picker is shown), an existing one starts
  // collapsed so the scene can be read at a glance
  const [expanded, setExpanded] = useState(props.action.type === null);
  const isExpanded = expanded || isStructuralCondition;

  const toggleExpanded = useCallback(() => {
    setExpanded(previousExpanded => !previousExpanded);
  }, []);

  const handleDelete = useCallback(() => {
    deleteAction(path);
  }, [path, deleteAction]);

  const addParallelAction = useCallback(() => {
    addAction(
      path
        .split('.')
        .slice(0, -1)
        .join('.')
    );
  }, [path, addAction]);

  // The drag handle drives the pointer-events engine; the arrow keys move
  // the card one position at a time, so dragging is never the only way
  const onHandlePointerDown = useCallback(
    event => {
      if (isCondition) {
        startConditionDrag(event, { actionPath: path, moveCard });
      } else if (isSequentialStep) {
        startStepDrag(event, { groupPath, moveCardGroup });
      } else {
        startParallelCardDrag(event, { actionPath: path, moveCard });
      }
    },
    [isCondition, isSequentialStep, path, groupPath, moveCard, moveCardGroup]
  );
  const onHandleKeyDown = useCallback(
    event => {
      if (isCondition) {
        moveConditionWithKeyboard(event, { actionPath: path, moveCard });
      } else if (isSequentialStep) {
        moveStepWithKeyboard(event, { groupPath, moveCardGroup });
      } else {
        moveParallelCardWithKeyboard(event, { actionPath: path, moveCard });
      }
    },
    [isCondition, isSequentialStep, path, groupPath, moveCard, moveCardGroup]
  );

  const summary = !isExpanded
    ? getActionSummary(
        props.action,
        props.intl.dictionary,
        props.deviceFeatures,
        props.thermostatSchedules,
        props.names
      )
    : null;
  // an action declared by an external integration is titled by its manifest
  // label; an orphan one (uninstalled, key removed) keeps the generic label
  const declarationTitle =
    props.action.type === ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION
      ? getSceneDeclarationTitle(
          props.sceneIntegrations,
          SCENE_DECLARATION_KINDS.action,
          props.action,
          get(props, 'user.language') || 'en'
        )
      : null;

  // A card of a parallel block and a condition are slots of their list, so
  // the drop placement can be computed from the pointer position alone
  const slotAttributes = isCondition
    ? { 'data-condition-slot': true, 'data-card-index': cardIndex }
    : isParallelMember
    ? { 'data-card-slot': true, 'data-card-index': cardIndex }
    : {};
  // A plain step welcomes a dropped parallel card: it joins the step as an
  // "at the same time" action (structural blocks and the type picker do not)
  const mergeAttributes =
    isSequentialStep && !isStructuralCondition && props.action.type !== null
      ? {
          'data-step-merge': true,
          'data-group-path': groupPath,
          'data-drop-active-class': style.mergeTargetActive
        }
      : {};

  return (
    <div class="col-12" {...slotAttributes}>
      <div class={cx('card user-select-none', style.stepCard)} {...mergeAttributes}>
        <div class={cx('card-header', style.stepCardHeader)}>
          <span
            class={cx(style.stepIconTile, style[COLOR_CLASS[ACTION_COLOR[props.action.type]] || 'typePickerIconGray'])}
          >
            {props.action.type !== null && <i class={cx(ACTION_ICON[props.action.type], 'dark-mode-fe-none-filter')} />}
            {props.action.type === null && <i class="fe fe-plus-circle" />}
          </span>
          <div class={style.stepText} onClick={toggleExpanded} data-not-an-edit>
            <span class={style.stepLabel} data-step-label>
              {declarationTitle || <Text id={`editScene.actions.${props.action.type}`} />}
              {props.action.type === null && props.path.includes('if') && <Text id="editScene.newCondition" />}
              {props.action.type === null && !props.path.includes('if') && <Text id="editScene.newAction" />}
            </span>
            {summary && <span class={style.stepSummary}>{summary}</span>}
          </div>
          {props.highLightedActions && props.highLightedActions[props.path] && <div class="card-status bg-blue" />}
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
            <Localizer>
              <button
                type="button"
                onClick={handleDelete}
                class={cx('card-options-remove mr-4', style.cardOptionButton)}
                aria-label={
                  <Text id={isCondition ? 'editScene.deleteConditionButton' : 'editScene.deleteActionButton'} />
                }
              >
                <i class="fe fe-x" />
              </button>
            </Localizer>
            {!isStructuralCondition && (
              <Localizer>
                <button
                  type="button"
                  onClick={toggleExpanded}
                  data-not-an-edit
                  class={style.cardOptionButton}
                  aria-expanded={isExpanded}
                  aria-label={<Text id={isExpanded ? 'editScene.collapseStepButton' : 'editScene.expandStepButton'} />}
                >
                  <i class={cx('fe', isExpanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
                </button>
              </Localizer>
            )}
          </div>
        </div>
        <div class={cx('card-body', { 'd-none': !isExpanded })}>
          {(() => {
            const Component = ACTION_COMPONENTS[props.action.type];
            if (!Component) return null;

            const commonProps = {
              action: props.action,
              allActions: props.allActions,
              path,
              updateActionProperty: props.updateActionProperty,
              variables: props.variables,
              setVariables: props.setVariables,
              actionsGroupsBefore: props.actionsGroupsBefore,
              triggersVariables: props.triggersVariables,
              deleteAction: props.deleteAction,
              deleteActionGroup: props.deleteActionGroup,
              addAction: props.addAction,
              moveCard: props.moveCard,
              moveCardGroup: props.moveCardGroup,
              scene: props.scene,
              sceneIntegrations: props.sceneIntegrations,
              deviceFeatures: props.deviceFeatures,
              thermostatSchedules: props.thermostatSchedules,
              names: props.names
            };

            return <Component {...commonProps} />;
          })()}
          {!isCondition && !isStructuralCondition && props.action.type !== null && props.showParallelLink && (
            <div class="text-right mt-3">
              <button
                type="button"
                class={cx('text-muted', style.parallelLink, style.cardOptionButton)}
                onClick={addParallelAction}
              >
                <i class="fe fe-git-merge" /> <Text id="editScene.addParallelActionButton" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default connect('user', {})(withIntlAsProp(ActionCard));
