import get from 'get-value';

import { ACTIONS, EVENTS } from '../../../../../../server/utils/constants';
import { ACTION_ICON, ACTION_COLOR, TRIGGER_ICON, TRIGGER_COLOR, COLOR_CLASS } from '../typesCatalog';
import { getActionSummary, getTriggerSummary } from '../summary';
import { SCENE_DECLARATION_KINDS, getSceneDeclarationTitle } from '../sceneIntegrations';
import editStyle from '../style.css';

export const isBlockAction = action =>
  Boolean(action) && (action.type === ACTIONS.CONDITION.IF_THEN_ELSE || action.type === ACTIONS.CONDITION.WHILE);

const colorClassOf = color => editStyle[COLOR_CLASS[color] || 'typePickerIconGray'];

// What a row of the mobile timeline shows for a step (docs/specs/scene-editor-mobile.md, E.3)
export const getActionRowInfo = (action, path, context) => {
  const { dictionary, deviceFeatures, thermostatSchedules, sceneIntegrations, language } = context;
  if (!action || action.type === null) {
    return {
      title: get(dictionary, path.includes('.if.') ? 'editScene.newCondition' : 'editScene.newAction'),
      summary: null,
      icon: 'fe fe-plus-circle',
      colorClass: colorClassOf('gray')
    };
  }
  const declarationTitle =
    action.type === ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION
      ? getSceneDeclarationTitle(sceneIntegrations, SCENE_DECLARATION_KINDS.action, action, language)
      : null;
  const title = declarationTitle || get(dictionary, `editScene.actions.${action.type}`) || action.type;
  let summary = getActionSummary(action, dictionary, deviceFeatures, thermostatSchedules);
  if (isBlockAction(action)) {
    // a block is read through its conditions
    const conditions = Array.isArray(action.if) ? action.if : [];
    summary =
      conditions.length > 0
        ? conditions
            .map(condition =>
              condition.type
                ? get(dictionary, `editScene.actions.${condition.type}`)
                : get(dictionary, 'editScene.newCondition')
            )
            .join(' · ')
        : get(dictionary, 'editScene.mobile.noCondition');
  }
  return {
    title,
    summary,
    icon: ACTION_ICON[action.type] || 'fe fe-box',
    colorClass: colorClassOf(ACTION_COLOR[action.type])
  };
};

export const getTriggerRowInfo = (trigger, context) => {
  const { dictionary, sceneIntegrations, language } = context;
  if (!trigger || trigger.type === null) {
    return {
      title: get(dictionary, 'editScene.newTrigger'),
      summary: null,
      icon: 'fe fe-plus-circle',
      colorClass: colorClassOf('gray')
    };
  }
  const declarationTitle =
    trigger.type === EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT
      ? getSceneDeclarationTitle(sceneIntegrations, SCENE_DECLARATION_KINDS.trigger, trigger, language)
      : null;
  return {
    title: declarationTitle || get(dictionary, `editScene.triggers.${trigger.type}`) || trigger.type,
    summary: getTriggerSummary(trigger, dictionary),
    icon: TRIGGER_ICON[trigger.type] || 'fe fe-box',
    colorClass: colorClassOf(TRIGGER_COLOR[trigger.type])
  };
};

// Every action of the scene, at every level (root steps, conditions of the if/while blocks,
// actions of their branches): the mobile editor keeps one mounted sheet per entry (E.4)
export const collectActions = (actions, prefix = '') => {
  const collected = [];
  (actions || []).forEach((group, groupIndex) => {
    (group || []).forEach((action, actionIndex) => {
      const path = prefix ? `${prefix}.${groupIndex}.${actionIndex}` : `${groupIndex}.${actionIndex}`;
      collected.push({ path, action });
      if (isBlockAction(action)) {
        (Array.isArray(action.if) ? action.if : []).forEach((condition, conditionIndex) => {
          collected.push({ path: `${path}.if.${conditionIndex}`, action: condition });
        });
        collected.push(...collectActions(action.then, `${path}.then`));
        collected.push(...collectActions(action.else, `${path}.else`));
      }
    });
  });
  return collected;
};

const countListChanges = (savedList, currentList) => {
  const saved = (savedList || []).map(item => JSON.stringify(item));
  const current = (currentList || []).map(item => JSON.stringify(item));
  const unmatchedCurrent = [];
  const remaining = saved.slice();
  current.forEach(item => {
    const index = remaining.indexOf(item);
    if (index >= 0) {
      remaining.splice(index, 1);
    } else {
      unmatchedCurrent.push(item);
    }
  });
  const changes = Math.max(remaining.length, unmatchedCurrent.length);
  // the same items in another order: one change
  if (changes === 0 && saved.join('\n') !== current.join('\n')) {
    return 1;
  }
  return changes;
};

const rootSteps = scene => (scene.actions || []).filter(group => Array.isArray(group) && group.length > 0);

// The "N changes" of the bottom bar (E.7)
export const countChanges = (savedScene, scene) => {
  let changes = 0;
  ['name', 'description', 'icon'].forEach(key => {
    if ((savedScene[key] || '') !== (scene[key] || '')) {
      changes += 1;
    }
  });
  if (JSON.stringify(savedScene.tags || []) !== JSON.stringify(scene.tags || [])) {
    changes += 1;
  }
  changes += countListChanges(savedScene.triggers, scene.triggers);
  changes += countListChanges(rootSteps(savedScene), rootSteps(scene));
  return changes;
};
