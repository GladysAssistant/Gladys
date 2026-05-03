import { ACTIONS, EVENTS } from '../../../../../../server/utils/constants';

export const NODE_TYPES = {
  TRIGGER: 'triggerNode',
  ACTION: 'actionNode',
  CONDITION: 'conditionNode',
};

const H_SPACING = 280;
const V_SPACING = 160;
const START_X = 60;
const START_Y = 60;

const TRIGGER_LABELS = {
  [EVENTS.DEVICE.NEW_STATE]: 'État d\'appareil',
  [EVENTS.TIME.CHANGED]: 'Heure planifiée',
  [EVENTS.TIME.SUNSET]: 'Coucher du soleil',
  [EVENTS.TIME.SUNRISE]: 'Lever du soleil',
  [EVENTS.USER_PRESENCE.BACK_HOME]: 'Retour maison',
  [EVENTS.USER_PRESENCE.LEFT_HOME]: 'Départ maison',
  [EVENTS.HOUSE.EMPTY]: 'Maison vide',
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: 'Maison occupée',
  [EVENTS.AREA.USER_ENTERED]: 'Entrée dans zone',
  [EVENTS.AREA.USER_LEFT]: 'Sortie de zone',
  [EVENTS.CALENDAR.EVENT_IS_COMING]: 'Événement calendrier',
  [EVENTS.ALARM.ARM]: 'Alarme armée',
  [EVENTS.ALARM.ARMING]: 'Alarme en armement',
  [EVENTS.ALARM.DISARM]: 'Alarme désarmée',
  [EVENTS.ALARM.PARTIAL_ARM]: 'Alarme partielle',
  [EVENTS.ALARM.PANIC]: 'Panique',
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: 'Trop de tests de code',
  [EVENTS.SYSTEM.START]: 'Démarrage Gladys',
  [EVENTS.MQTT.RECEIVED]: 'Message MQTT reçu',
};

const TRIGGER_ICONS = {
  [EVENTS.DEVICE.NEW_STATE]: 'fe-activity',
  [EVENTS.TIME.CHANGED]: 'fe-watch',
  [EVENTS.TIME.SUNSET]: 'fe-sunset',
  [EVENTS.TIME.SUNRISE]: 'fe-sunrise',
  [EVENTS.USER_PRESENCE.BACK_HOME]: 'fe-home',
  [EVENTS.USER_PRESENCE.LEFT_HOME]: 'fe-log-out',
  [EVENTS.HOUSE.EMPTY]: 'fe-home',
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: 'fe-home',
  [EVENTS.AREA.USER_ENTERED]: 'fe-compass',
  [EVENTS.AREA.USER_LEFT]: 'fe-compass',
  [EVENTS.CALENDAR.EVENT_IS_COMING]: 'fe-calendar',
  [EVENTS.ALARM.ARM]: 'fe-bell',
  [EVENTS.ALARM.ARMING]: 'fe-clock',
  [EVENTS.ALARM.DISARM]: 'fe-bell-off',
  [EVENTS.ALARM.PARTIAL_ARM]: 'fe-bell',
  [EVENTS.ALARM.PANIC]: 'fe-alert-triangle',
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: 'fe-alert-triangle',
  [EVENTS.SYSTEM.START]: 'fe-power',
  [EVENTS.MQTT.RECEIVED]: 'fe-hash',
};

const ACTION_LABELS = {
  [ACTIONS.LIGHT.TURN_ON]: 'Allumer lumière',
  [ACTIONS.LIGHT.TURN_OFF]: 'Éteindre lumière',
  [ACTIONS.LIGHT.TOGGLE]: 'Basculer lumière',
  [ACTIONS.LIGHT.BLINK]: 'Faire clignoter',
  [ACTIONS.SWITCH.TURN_ON]: 'Allumer switch',
  [ACTIONS.SWITCH.TURN_OFF]: 'Éteindre switch',
  [ACTIONS.SWITCH.TOGGLE]: 'Basculer switch',
  [ACTIONS.TIME.DELAY]: 'Attendre',
  [ACTIONS.SCENE.START]: 'Démarrer scène',
  [ACTIONS.MESSAGE.SEND]: 'Envoyer message',
  [ACTIONS.MESSAGE.SEND_CAMERA]: 'Envoyer image caméra',
  [ACTIONS.CONDITION.IF_THEN_ELSE]: 'Si / Alors / Sinon',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'Continuer si',
  [ACTIONS.CONDITION.CHECK_TIME]: 'Vérifier l\'heure',
  [ACTIONS.DEVICE.SET_VALUE]: 'Modifier appareil',
  [ACTIONS.DEVICE.GET_VALUE]: 'Lire état appareil',
  [ACTIONS.HTTP.REQUEST]: 'Requête HTTP',
  [ACTIONS.MQTT.SEND]: 'Envoyer MQTT',
  [ACTIONS.ZIGBEE2MQTT.SEND]: 'Envoyer Zigbee2MQTT',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'Marquer présent',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'Marquer absent',
  [ACTIONS.USER.CHECK_PRESENCE]: 'Vérifier présence',
  [ACTIONS.HOUSE.IS_EMPTY]: 'Vérifier maison vide',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'Vérifier maison occupée',
  [ACTIONS.AI.ASK]: 'Demander à l\'IA',
  [ACTIONS.ALARM.SET_ALARM_MODE]: 'Définir mode alarme',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'Vérifier mode alarme',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'Événement en cours',
  [ACTIONS.ECOWATT.CONDITION]: 'Condition Ecowatt',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'Condition EDF Tempo',
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: 'Notification sonore',
  [ACTIONS.SMS.SEND]: 'Envoyer SMS',
};

const ACTION_ICONS = {
  [ACTIONS.LIGHT.TURN_ON]: 'fe-toggle-right',
  [ACTIONS.LIGHT.TURN_OFF]: 'fe-toggle-left',
  [ACTIONS.LIGHT.TOGGLE]: 'fe-shuffle',
  [ACTIONS.LIGHT.BLINK]: 'fe-sun',
  [ACTIONS.SWITCH.TURN_ON]: 'fe-toggle-right',
  [ACTIONS.SWITCH.TURN_OFF]: 'fe-toggle-left',
  [ACTIONS.SWITCH.TOGGLE]: 'fe-shuffle',
  [ACTIONS.TIME.DELAY]: 'fe-clock',
  [ACTIONS.SCENE.START]: 'fe-fast-forward',
  [ACTIONS.MESSAGE.SEND]: 'fe-message-square',
  [ACTIONS.MESSAGE.SEND_CAMERA]: 'fe-camera',
  [ACTIONS.CONDITION.IF_THEN_ELSE]: 'fe-git-branch',
  [ACTIONS.CONDITION.ONLY_CONTINUE_IF]: 'fe-filter',
  [ACTIONS.CONDITION.CHECK_TIME]: 'fe-watch',
  [ACTIONS.DEVICE.SET_VALUE]: 'fe-sliders',
  [ACTIONS.DEVICE.GET_VALUE]: 'fe-refresh-cw',
  [ACTIONS.HTTP.REQUEST]: 'fe-link',
  [ACTIONS.MQTT.SEND]: 'fe-send',
  [ACTIONS.ZIGBEE2MQTT.SEND]: 'fe-zap',
  [ACTIONS.USER.SET_SEEN_AT_HOME]: 'fe-home',
  [ACTIONS.USER.SET_OUT_OF_HOME]: 'fe-log-out',
  [ACTIONS.USER.CHECK_PRESENCE]: 'fe-user-check',
  [ACTIONS.HOUSE.IS_EMPTY]: 'fe-home',
  [ACTIONS.HOUSE.IS_NOT_EMPTY]: 'fe-home',
  [ACTIONS.AI.ASK]: 'fe-cpu',
  [ACTIONS.ALARM.SET_ALARM_MODE]: 'fe-bell',
  [ACTIONS.ALARM.CHECK_ALARM_MODE]: 'fe-bell',
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'fe-calendar',
  [ACTIONS.ECOWATT.CONDITION]: 'fe-zap',
  [ACTIONS.EDF_TEMPO.CONDITION]: 'fe-zap',
  [ACTIONS.MUSIC.PLAY_NOTIFICATION]: 'fe-music',
  [ACTIONS.SMS.SEND]: 'fe-message-circle',
};

const truncate = (str, max = 38) =>
  str && str.length > max ? str.substring(0, max) + '…' : str || null;

export function getTriggerLabel(trigger) {
  return TRIGGER_LABELS[trigger.type] || trigger.type || 'Déclencheur';
}

export function getTriggerSummary(trigger) {
  if (!trigger) return null;
  switch (trigger.type) {
    case EVENTS.TIME.CHANGED: {
      switch (trigger.scheduler_type) {
        case 'every-day':
          return trigger.time ? `Chaque jour à ${trigger.time}` : 'Chaque jour';
        case 'every-week':
          return trigger.time ? `Chaque semaine à ${trigger.time}` : 'Chaque semaine';
        case 'every-month':
          return trigger.day_of_the_month
            ? `Chaque mois le ${trigger.day_of_the_month}${trigger.time ? ' à ' + trigger.time : ''}`
            : 'Chaque mois';
        case 'interval': {
          const UNIT_FR = { second: 'seconde(s)', minute: 'minute(s)', hour: 'heure(s)' };
          return trigger.interval && trigger.unit
            ? `Toutes les ${trigger.interval} ${UNIT_FR[trigger.unit] || trigger.unit}`
            : null;
        }
        case 'custom-time':
          return trigger.date
            ? `${trigger.date}${trigger.time ? ' à ' + trigger.time : ''}`
            : null;
        default:
          return null;
      }
    }
    case EVENTS.MQTT.RECEIVED:
      return trigger.topic || null;
    case EVENTS.DEVICE.NEW_STATE:
      return trigger.device_feature_label || trigger.device_feature || null;
    case EVENTS.USER_PRESENCE.BACK_HOME:
    case EVENTS.USER_PRESENCE.LEFT_HOME: {
      const user = trigger.user_label || trigger.user || null;
      const house = trigger.house_label || trigger.house || null;
      if (!user && !house) return null;
      return house ? [user, house] : user;
    }
    case EVENTS.HOUSE.EMPTY:
    case EVENTS.HOUSE.NO_LONGER_EMPTY:
      return trigger.house_label || trigger.house || null;
    case EVENTS.AREA.USER_ENTERED:
    case EVENTS.AREA.USER_LEFT: {
      const user = trigger.user_label || trigger.user || null;
      const area = trigger.area_label || trigger.area || null;
      if (!user && !area) return null;
      return area ? [user, area] : user;
    }
    case EVENTS.CALENDAR.EVENT_IS_COMING: {
      const evName = trigger.calendar_event_name ? truncate(trigger.calendar_event_name) : null;
      const cals = trigger.calendars_label
        || (trigger.calendars && trigger.calendars.length > 0
          ? `${trigger.calendars.length} calendrier${trigger.calendars.length > 1 ? 's' : ''}`
          : null);
      if (evName && cals) return [evName, cals];
      return evName || cals || null;
    }
    default:
      return null;
  }
}

export function getTriggerIcon(trigger) {
  return TRIGGER_ICONS[trigger.type] || 'fe-zap';
}

export function getActionLabel(action) {
  return ACTION_LABELS[action.type] || action.type || 'Action';
}

export function getActionSummary(action) {
  if (!action) return null;
  switch (action.type) {
    case ACTIONS.TIME.DELAY:
      if (action.value != null) return `${action.value} ${action.unit || 'sec'}`;
      if (action.evaluate_value) return truncate(action.evaluate_value);
      return null;
    case ACTIONS.MESSAGE.SEND:
    case ACTIONS.AI.ASK: {
      const text = truncate(action.text);
      if (!text) return null;
      const dest = action.user_label || action.user;
      return dest ? [text, `→ ${dest}`] : text;
    }
    case ACTIONS.MESSAGE.SEND_CAMERA: {
      const dest = action.user_label || action.user;
      return dest ? `→ ${dest}` : null;
    }
    case ACTIONS.SMS.SEND:
    case ACTIONS.MUSIC.PLAY_NOTIFICATION:
      return truncate(action.text);
    case ACTIONS.HTTP.REQUEST:
      if (!action.url) return null;
      return [`${action.method || 'GET'}`, truncate(action.url)];
    case ACTIONS.MQTT.SEND:
    case ACTIONS.ZIGBEE2MQTT.SEND: {
      const topic = action.topic || null;
      if (!topic) return null;
      const msg = action.message ? truncate(action.message, 30) : null;
      return msg ? [topic, msg] : topic;
    }
    case ACTIONS.ALARM.SET_ALARM_MODE:
    case ACTIONS.ALARM.CHECK_ALARM_MODE:
      return action.alarm_mode || null;
    case ACTIONS.CONDITION.CHECK_TIME: {
      const timeParts = [];
      if (action.after) timeParts.push(`après ${action.after}`);
      if (action.before) timeParts.push(`avant ${action.before}`);
      if (timeParts.length === 0) return null;
      const timeStr = timeParts.join(', ');
      const days = action.days_of_the_week;
      if (days && days.length > 0 && days.length < 7) {
        const dayAbbr = days.map(d => d.substring(0, 2)).join(' ');
        return [timeStr, dayAbbr];
      }
      return timeStr;
    }
    case ACTIONS.CONDITION.ONLY_CONTINUE_IF: {
      const n = action.conditions ? action.conditions.length : 0;
      return n > 0 ? `${n} condition${n > 1 ? 's' : ''}` : null;
    }
    case ACTIONS.CONDITION.IF_THEN_ELSE: {
      const n = action.if ? action.if.length : 0;
      return n > 0 ? `${n} condition${n > 1 ? 's' : ''}` : null;
    }
    case ACTIONS.DEVICE.GET_VALUE:
      return action.device_feature_label || action.device_feature || null;
    case ACTIONS.DEVICE.SET_VALUE: {
      const name = action.device_feature_label || action.device_feature;
      if (!name) return null;
      if (action.value != null) return [name, `= ${action.value}`];
      if (action.evaluate_value) return [name, `= ${truncate(action.evaluate_value, 25)}`];
      return name;
    }
    case ACTIONS.USER.SET_SEEN_AT_HOME:
    case ACTIONS.USER.SET_OUT_OF_HOME:
    case ACTIONS.USER.CHECK_PRESENCE: {
      const user = action.user_label || action.user || null;
      const house = action.house_label || action.house || null;
      if (!user && !house) return null;
      return house ? [user, house] : user;
    }
    case ACTIONS.HOUSE.IS_EMPTY:
    case ACTIONS.HOUSE.IS_NOT_EMPTY:
      return action.house_label || action.house || null;
    case ACTIONS.CALENDAR.IS_EVENT_RUNNING: {
      const evName = action.calendar_event_name ? truncate(action.calendar_event_name) : null;
      const cals = action.calendars_label
        || (action.calendars && action.calendars.length > 0
          ? `${action.calendars.length} calendrier${action.calendars.length > 1 ? 's' : ''}`
          : null);
      if (evName && cals) return [evName, cals];
      return evName || cals || null;
    }
    case ACTIONS.LIGHT.TURN_ON:
    case ACTIONS.LIGHT.TURN_OFF:
    case ACTIONS.LIGHT.TOGGLE:
    case ACTIONS.LIGHT.BLINK:
    case ACTIONS.SWITCH.TURN_ON:
    case ACTIONS.SWITCH.TURN_OFF:
    case ACTIONS.SWITCH.TOGGLE: {
      const n = action.devices ? action.devices.length : 0;
      return n > 0 ? `${n} appareil${n > 1 ? 's' : ''}` : null;
    }
    case ACTIONS.SCENE.START:
      return action.scene_label || action.scene || null;
    default:
      return null;
  }
}

export function getActionIcon(action) {
  return ACTION_ICONS[action.type] || 'fe-settings';
}

const CONDITION_ACTION_SET = new Set([
  ACTIONS.CONDITION.IF_THEN_ELSE,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.CONDITION.CHECK_TIME,
  ACTIONS.HOUSE.IS_EMPTY,
  ACTIONS.HOUSE.IS_NOT_EMPTY,
]);

export function isConditionAction(action) {
  return action != null && CONDITION_ACTION_SET.has(action.type);
}

export function isIfThenElse(action) {
  return action != null && action.type === ACTIONS.CONDITION.IF_THEN_ELSE;
}

// ── Edge style helpers ──────────────────────────────────────────────
const outerEdge = (id, source, target, sourceHandle, color = '#94a3b8') => ({
  id,
  source,
  ...(sourceHandle ? { sourceHandle } : {}),
  target,
  type: 'smoothstep',
  animated: false,
  ...(color !== '#94a3b8' ? { markerEnd: { type: 'arrowclosed', color } } : {}),
  style: { stroke: color, strokeWidth: 2 },
});

const branchEdge = (id, source, sourceHandle, target, color) => ({
  id,
  source,
  sourceHandle,
  target,
  type: 'smoothstep',
  animated: false,
  markerEnd: { type: 'arrowclosed', color },
  style: { stroke: color, strokeWidth: 2 },
});

// ── Create an action node (shared between main flow and branches) ───
function makeActionNode(id, action, position, extraData) {
  return {
    id,
    type: isConditionAction(action) ? NODE_TYPES.CONDITION : NODE_TYPES.ACTION,
    position,
    data: {
      action,
      label: getActionLabel(action),
      icon: getActionIcon(action),
      ...extraData,
    },
  };
}

export function sceneToGraph(scene) {
  const nodes = [];
  const edges = [];

  const triggers = scene.triggers || [];
  const actionsGroups = scene.actions || [];

  // ── Trigger nodes — top row ──────────────────────────────────────
  triggers.forEach((trigger, idx) => {
    nodes.push({
      id: `trigger-${idx}`,
      type: NODE_TYPES.TRIGGER,
      position: { x: START_X + idx * H_SPACING, y: START_Y },
      data: {
        trigger,
        triggerIndex: idx,
        label: getTriggerLabel(trigger),
        icon: getTriggerIcon(trigger),
      },
    });
  });

  // Pre-compute the Y position of each action group.
  // Groups that contain an IF_THEN_ELSE reserve extra rows so branch nodes
  // sit between the condition and its successor — never at the same Y as
  // any other main-flow group.
  const groupY = [];
  {
    let y = START_Y + V_SPACING;
    actionsGroups.forEach(actionGroup => {
      groupY.push(y);
      const maxDepth = actionGroup.reduce((m, a) => {
        if (!isIfThenElse(a)) return m;
        return Math.max(m, Math.max(
          a.then ? a.then.length : 0,
          a.else ? a.else.length : 0
        ));
      }, 0);
      y += V_SPACING * Math.max(1, maxDepth + 1);
    });
  }

  // Horizontal centre shared by all main-flow groups and their branches.
  // Derived from the trigger row so a single trigger stays above the first node,
  // and multiple triggers spread symmetrically around the same axis.
  const flowCenterX = triggers.length > 0
    ? START_X + (triggers.length - 1) * H_SPACING / 2
    : START_X;

  let prevIds = triggers.map((_, idx) => `trigger-${idx}`);
  // Map nodeId → action to determine correct source handle for sequential edges
  const actionById = {};

  actionsGroups.forEach((actionGroup, groupIdx) => {
    const currentIds = [];
    const rowY = groupY[groupIdx];
    // Centre this group below its predecessors.  A group with N nodes spreads
    // N/2 slots left and right of flowCenterX so every group shares the same
    // vertical axis regardless of width.
    const groupStartX = flowCenterX - (actionGroup.length - 1) * H_SPACING / 2;

    actionGroup.forEach((action, actionIdx) => {
      const id = `action-${groupIdx}-${actionIdx}`;
      const condX = groupStartX + actionIdx * H_SPACING;
      actionById[id] = action;

      nodes.push(
        makeActionNode(id, action, { x: condX, y: rowY }, {
          groupIndex: groupIdx,
          actionIndex: actionIdx,
          path: `${groupIdx}.${actionIdx}`,
        })
      );

      // ── Branch nodes for Si/Alors/Sinon ────────────────────────
      if (isIfThenElse(action)) {
        // Because groupY already reserves one row per branch step between this
        // condition and the next main-flow group, branch nodes never share a Y
        // with any main-flow node — simple symmetric X formulas are safe.

        // "Oui" / then branch — all sequential steps, to the LEFT of condX.
        // thenCenterX is the horizontal centre of step 0 (anchored left of START_X
        // so no then-node shares X with any sibling in the same action group).
        // Every step k is centred at that same X: centerX + H_SPACING*(aIdx - (count-1)/2).
        // For step 0 this is algebraically identical to the old START_X-(count-aIdx)*H_SPACING
        // formula; for step 1+ it centres the nodes below their parents instead of
        // piling them against the leftmost column.
        const thenGroups = action.then || [];
        const thenCount0 = thenGroups.length > 0 ? thenGroups[0].length : 1;
        // thenCenterX: ideal centre for the then-branch (step-0 rightmost node sits at groupStartX - H_SPACING).
        // For wider steps the centre shifts left so no node crosses groupStartX - H_SPACING (suite boundary).
        const thenCenterX = groupStartX - H_SPACING * (thenCount0 + 1) / 2;
        const thenMaxX = groupStartX - H_SPACING;
        let prevThenIds = null;
        thenGroups.forEach((thenGroup, stepIdx) => {
          const stepY = rowY + V_SPACING * (1 + stepIdx);
          const count = thenGroup.length;
          // Clamp centre so the rightmost node never crosses the suite boundary
          const stepCenterX = Math.min(thenCenterX, thenMaxX - (count - 1) * H_SPACING / 2);
          const stepIds = [];
          thenGroup.forEach((thenAction, aIdx) => {
            const thenId = `${id}-then-${stepIdx}-${aIdx}`;
            const thenX = stepCenterX + H_SPACING * (aIdx - (count - 1) / 2);
            nodes.push(makeActionNode(thenId, thenAction, { x: thenX, y: stepY }, { isBranch: true }));
            stepIds.push(thenId);
          });
          if (stepIdx === 0) {
            stepIds.forEach(thenId =>
              edges.push(branchEdge(`e-${id}-then-${thenId}`, id, 'then', thenId, '#10b981'))
            );
          } else {
            prevThenIds.forEach(prevId =>
              stepIds.forEach(thenId =>
                edges.push(outerEdge(`e-${prevId}-${thenId}`, prevId, thenId))
              )
            );
          }
          prevThenIds = stepIds;
        });

        // "Non" / else branch — all sequential steps, to the RIGHT of all siblings.
        // elseCenterX mirrors the logic above: step 0 starts after the rightmost
        // sibling, and every subsequent step is centred below step 0.
        const elseStartX = Math.max(condX + H_SPACING, groupStartX + actionGroup.length * H_SPACING);
        const elseGroups = action.else || [];
        const elseCount0 = elseGroups.length > 0 ? elseGroups[0].length : 1;
        // elseCenterX: ideal centre for the else-branch (step-0 leftmost node sits at elseStartX).
        // For wider steps the centre shifts right so no node crosses elseStartX (suite boundary).
        const elseCenterX = elseStartX + H_SPACING * (elseCount0 - 1) / 2;
        let prevElseIds = null;
        elseGroups.forEach((elseGroup, stepIdx) => {
          const stepY = rowY + V_SPACING * (1 + stepIdx);
          const count = elseGroup.length;
          // Clamp centre so the leftmost node never crosses the suite boundary
          const stepCenterX = Math.max(elseCenterX, elseStartX + (count - 1) * H_SPACING / 2);
          const stepIds = [];
          elseGroup.forEach((elseAction, aIdx) => {
            const elseId = `${id}-else-${stepIdx}-${aIdx}`;
            const elseX = stepCenterX + H_SPACING * (aIdx - (count - 1) / 2);
            nodes.push(makeActionNode(elseId, elseAction, { x: elseX, y: stepY }, { isBranch: true }));
            stepIds.push(elseId);
          });
          if (stepIdx === 0) {
            stepIds.forEach(elseId =>
              edges.push(branchEdge(`e-${id}-else-${elseId}`, id, 'else', elseId, '#ef4444'))
            );
          } else {
            prevElseIds.forEach(prevId =>
              stepIds.forEach(elseId =>
                edges.push(outerEdge(`e-${prevId}-${elseId}`, prevId, elseId))
              )
            );
          }
          prevElseIds = stepIds;
        });
      }

      currentIds.push(id);
    });

    // Outer sequential edges — IF_THEN_ELSE nodes use the 'after' handle;
    // non-branching condition nodes emit a green edge.
    prevIds.forEach(sourceId => {
      const srcAction = actionById[sourceId];
      const sh = isIfThenElse(srcAction) ? 'after' : undefined;
      const color =
        isConditionAction(srcAction) && !isIfThenElse(srcAction) ? '#10b981' : '#94a3b8';
      currentIds.forEach(targetId => {
        edges.push(outerEdge(`e-${sourceId}-${targetId}`, sourceId, targetId, sh, color));
      });
    });

    prevIds = currentIds;
  });

  return { nodes, edges };
}
