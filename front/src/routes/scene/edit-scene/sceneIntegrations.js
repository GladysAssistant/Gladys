import { ACTIONS, EVENTS } from '../../../../../server/utils/constants';
import { getLocalizedText } from '../../../utils/getLocalizedText';

// Scene triggers and actions declared by the external integrations
// (GET /api/v1/external_integration/scene): one generic trigger type and one
// generic action type in the scene engine, the integration selector and the
// declared key carried as fields. The helpers below turn the declarations into
// picker entries, resolve a stored card back to its declaration, and tell an
// orphan card (uninstalled integration, key removed by an update) from a live
// one — a stored card is never edited behind the user's back.

export const INTEGRATIONS_CATEGORY_KEY = 'integrations';
export const INTEGRATIONS_CATEGORY_COLOR = 'teal';
export const INTEGRATION_DECLARATION_ICON = 'fe fe-box';

// statuses under which a declared trigger cannot fire and a declared action
// cannot run: the card stays editable, with a softer warning
const INACTIVE_STATUSES = ['STOPPED', 'ERROR', 'DISABLED'];

const SCENE_TRIGGER_KIND = {
  type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
  listName: 'scene_triggers',
  keyProperty: 'trigger_key'
};
const SCENE_ACTION_KIND = {
  type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION,
  listName: 'scene_actions',
  keyProperty: 'action_key'
};

export const SCENE_DECLARATION_KINDS = {
  trigger: SCENE_TRIGGER_KIND,
  action: SCENE_ACTION_KIND
};

// The picker value of a declaration: the generic type, the integration selector
// and the declared key. Selectors are [a-z0-9-], keys [a-z0-9_]: the separator
// can collide with neither.
const PICKER_VALUE_SEPARATOR = '|';

export const buildPickerValue = (kind, selector, key) => [kind.type, selector, key].join(PICKER_VALUE_SEPARATOR);

export const parsePickerValue = value => {
  if (typeof value !== 'string' || !value.includes(PICKER_VALUE_SEPARATOR)) {
    return null;
  }
  const [type, selector, key] = value.split(PICKER_VALUE_SEPARATOR);
  return { type, selector, key };
};

// The default values of the declared fields (the initial `fields` of a new
// card), sections carrying no value
export const getDeclarationDefaults = declaration => {
  const defaults = {};
  ((declaration && declaration.fields) || []).forEach(field => {
    if (field.type !== 'section' && field.default !== undefined) {
      defaults[field.key] = field.default;
    }
  });
  return defaults;
};

// The "Integrations" category of a picker: one entry per (integration,
// declaration), subtitled by the integration name since two integrations may
// both declare "Take a snapshot". Empty when nothing is declared, so the
// category never shows up on an instance without such integrations.
export const buildIntegrationsCategory = (sceneIntegrations, kind, language) => {
  const items = [];
  (sceneIntegrations || []).forEach(integration => {
    (integration[kind.listName] || []).forEach(declaration => {
      items.push({
        value: buildPickerValue(kind, integration.selector, declaration.key),
        label: getLocalizedText(declaration.label, language) || declaration.key,
        subtitle: integration.name,
        description: getLocalizedText(declaration.description, language),
        icon: INTEGRATION_DECLARATION_ICON
      });
    });
  });
  if (items.length === 0) {
    return null;
  }
  return { key: INTEGRATIONS_CATEGORY_KEY, color: INTEGRATIONS_CATEGORY_COLOR, items };
};

// Resolve a stored card against the current declarations: the integration (or
// null when uninstalled), the declaration (or null when the key is no longer
// declared), and whether the integration is currently unable to serve it.
export const resolveSceneDeclaration = (sceneIntegrations, kind, step) => {
  const integration = (sceneIntegrations || []).find(candidate => candidate.selector === step.integration) || null;
  const declaration =
    (integration && (integration[kind.listName] || []).find(candidate => candidate.key === step[kind.keyProperty])) ||
    null;
  return {
    integration,
    declaration,
    inactive: Boolean(integration) && INACTIVE_STATUSES.includes(integration.status)
  };
};

// Header of a card: "<integration name> · <declaration label>", or null when
// the card cannot be resolved (the generic type label is shown instead)
export const getSceneDeclarationTitle = (sceneIntegrations, kind, step, language) => {
  const { integration, declaration } = resolveSceneDeclaration(sceneIntegrations, kind, step);
  if (!integration || !declaration) {
    return null;
  }
  return `${integration.name} · ${getLocalizedText(declaration.label, language) || declaration.key}`;
};

// A value typed in the generated form, converted to what the scene stores:
// a number field stores a number (the input gives a string), an emptied field
// stores null — a wildcard on a trigger, an omitted optional on an action
export const normalizeDeclaredFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (field.type === 'number') {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
  return value;
};

// True when a stored filter matches any value (the wildcard of the matcher)
export const isWildcardValue = value =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

// The scene variables a declared trigger exposes ({{triggerEvent.data.<key>}})
// or a declared action returns ({{<path>.<key>}}), in the editor's format
export const buildDeclaredVariables = (entries, language, namePrefix = '') =>
  (entries || []).map(entry => ({
    name: `${namePrefix}${entry.key}`,
    type: 'external-integration',
    ready: true,
    label: getLocalizedText(entry.label, language) || entry.key,
    data: {}
  }));

// The declared `required` fields of a live card still holding a wildcard,
// with their localized labels: the editor is the only place a required filter
// can be enforced (the matcher never consults the manifest), and a saved
// trigger with an empty required camera would fire on every camera. An
// orphan card (unresolved) is inert and is not walked.
export const getMissingRequiredFields = (sceneIntegrations, kind, step, language) => {
  const { integration, declaration } = resolveSceneDeclaration(sceneIntegrations, kind, step);
  if (!integration || !declaration) {
    return [];
  }
  const values = step.fields || {};
  return (declaration.fields || [])
    .filter(field => field.type !== 'section' && field.required && isWildcardValue(values[field.key]))
    .map(field => getLocalizedText(field.label, language) || field.key);
};

// Every action of a scene, the ones nested in if/then/else and while blocks
// included, as a flat list
export const flattenSceneActions = actions => {
  const flat = [];
  (actions || []).forEach(group => {
    (Array.isArray(group) ? group : [group]).forEach(action => {
      if (!action || typeof action !== 'object') {
        return;
      }
      flat.push(action);
      ['if', 'then', 'else'].forEach(branch => {
        if (Array.isArray(action[branch])) {
          flat.push(...flattenSceneActions(action[branch]));
        }
      });
    });
  });
  return flat;
};

// True when the scene holds at least one card of the two generic types: the
// only scenes whose save depends on the declaration catalog
export const hasIntegrationSteps = scene =>
  (scene.triggers || []).some(trigger => trigger.type === SCENE_TRIGGER_KIND.type) ||
  flattenSceneActions(scene.actions).some(action => action.type === SCENE_ACTION_KIND.type);

// The first required field left empty on a live integration card of the
// scene, as { title, field } for the save error, or null when the scene is
// complete
export const findMissingRequiredField = (sceneIntegrations, scene, language) => {
  const steps = [
    ...(scene.triggers || []).map(trigger => ({ kind: SCENE_DECLARATION_KINDS.trigger, step: trigger })),
    ...flattenSceneActions(scene.actions).map(action => ({ kind: SCENE_DECLARATION_KINDS.action, step: action }))
  ];
  for (let index = 0; index < steps.length; index += 1) {
    const { kind, step } = steps[index];
    if (step.type === kind.type) {
      const [field] = getMissingRequiredFields(sceneIntegrations, kind, step, language);
      if (field) {
        return { title: getSceneDeclarationTitle(sceneIntegrations, kind, step, language), field };
      }
    }
  }
  return null;
};
