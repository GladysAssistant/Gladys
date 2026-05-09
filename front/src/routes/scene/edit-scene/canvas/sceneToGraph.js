/**
 * sceneToGraph.js — conversion d'une scène Gladys vers un graphe React Flow.
 *
 * Responsabilités :
 *  - Définir les constantes de mise en page automatique (espacement, origine)
 *  - Fournir les tables de libellés/icônes pour déclencheurs et actions
 *  - Calculer les résumés affichés dans les nœuds (getTriggerSummary, getActionSummary)
 *  - Exposer les prédicats isConditionAction / isIfThenElse utilisés partout
 *  - Construire le tableau de nœuds + arêtes depuis la structure JSON de la scène
 *    (sceneToGraph), en plaçant les branches then/else décalées horizontalement
 */
import { ACTIONS, EVENTS } from '../../../../../../server/utils/constants';

// Identifiants de type de nœud React Flow — doivent correspondre aux clés de
// l'objet nodeTypes passé à <ReactFlow nodeTypes={...}> dans SceneCanvas.
export const NODE_TYPES = {
  TRIGGER: 'triggerNode',
  ACTION: 'actionNode',
  CONDITION: 'conditionNode',
};

// Espacement utilisé par le layout automatique (sceneToGraph).
// H_SPACING : distance horizontale entre nœuds d'un même groupe.
// V_SPACING : distance verticale entre groupes d'actions successifs.
const H_SPACING = 280;
// Espacement vertical pour les flux séquentiels simples (sans branche If/Then/Else).
const V_SPACING = 150;
// Espacement entre chaque rangée de nœuds à l'intérieur des branches If/Then/Else.
// Inférieur au V_BRANCH_STEP d'origine pour que l'arête "Suite" reste courte.
const V_BRANCH_STEP = 160;
const START_X = 60;
const START_Y = 60;
// Largeur fixe de tous les nœuds — doit correspondre au CSS .node { width }
// Utilisée pour convertir un X "centre" en X "coin supérieur gauche" (format React Flow).
const NODE_WIDTH = 260;
const HALF_W = NODE_WIDTH / 2;

const TRIGGER_LABELS = {
  [EVENTS.DEVICE.NEW_STATE]: 'État d\'appareil',
  [EVENTS.DEVICE.MULTI_STATE]: 'États multiples d\'appareil',
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
  [EVENTS.DEVICE.MULTI_STATE]: 'fe-layers',
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
  [ACTIONS.SWITCH.TURN_ON]: 'Allumer prise',
  [ACTIONS.SWITCH.TURN_OFF]: 'Éteindre prise',
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
  [ACTIONS.DEVICE.CHECK_VALUE]: 'Condition sur état',
  [ACTIONS.DEVICE.CHECK_MULTI_VALUE]: 'Condition sur états multiples',
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
  [ACTIONS.CALENDAR.IS_EVENT_RUNNING]: 'Condition sur un événement du calendrier',
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
  [ACTIONS.DEVICE.CHECK_VALUE]: 'fe-check-circle',
  [ACTIONS.DEVICE.CHECK_MULTI_VALUE]: 'fe-check-circle',
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

// Tronque une chaîne à max caractères pour les résumés affichés dans les nœuds.
// Retourne null si la chaîne est vide/undefined pour simplifier les tests conditionnels.
const truncate = (str, max = 38) =>
  str && str.length > max ? str.substring(0, max) + '…' : str || null;

// Retourne le libellé français du déclencheur, ou son type brut en fallback.
export function getTriggerLabel(trigger) {
  return TRIGGER_LABELS[trigger.type] || trigger.type || 'Déclencheur';
}

// Retourne une chaîne (ou un tableau de deux chaînes) résumant la configuration
// du déclencheur pour l'afficher en sous-titre dans le nœud. Retourne null si
// aucune information significative n'est disponible.
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
    case EVENTS.DEVICE.NEW_STATE: {
      const lbl = trigger.device_feature_label || trigger.device_feature || null;
      if (!lbl) return null;
      const sep = lbl.indexOf(' › ');
      return sep === -1 ? truncate(lbl) : [truncate(lbl.substring(0, sep)), truncate(lbl.substring(sep + 3))];
    }
    case EVENTS.DEVICE.MULTI_STATE: {
      const featureLabel = trigger.device_feature_label || trigger.device_feature || null;
      const count = Array.isArray(trigger.values) ? trigger.values.length : 0;
      const countLabel = `${count} valeur${count !== 1 ? 's' : ''} sélectionnée${count !== 1 ? 's' : ''}`;
      if (featureLabel) return [featureLabel, countLabel];
      return countLabel;
    }
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

// Retourne le nom de classe Feather Icons du déclencheur (préfixe "fe-").
export function getTriggerIcon(trigger) {
  return TRIGGER_ICONS[trigger.type] || 'fe-zap';
}

// Retourne le libellé français de l'action, ou son type brut en fallback.
export function getActionLabel(action) {
  return ACTION_LABELS[action.type] || action.type || 'Action';
}

// Retourne un résumé lisible de la configuration d'une action : chaîne simple ou
// tableau [ligne1, ligne2] affiché en sous-titre dans le nœud (nodeSummary / nodeSummary2).
// Retourne null si l'action n'a pas encore de paramètres renseignés.
export function getActionSummary(action) {
  if (!action) return null;
  switch (action.type) {
    case ACTIONS.TIME.DELAY: {
      if (action.evaluate_value) return truncate(action.evaluate_value);
      if (action.value != null) {
        // Unités stockées au pluriel anglais (secondes, minutes, hours, milliseconds)
        const UNIT_FR = {
          milliseconds: 'ms',
          seconds: 'seconde',
          minutes: 'minute',
          hours: 'heure',
        };
        const unitFr = UNIT_FR[action.unit] || action.unit || 's';
        const plural = action.value > 1 && unitFr !== 'ms' ? 's' : '';
        return `${action.value} ${unitFr}${plural}`;
      }
      return null;
    }
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
      return truncate(action.text, 60);
    case ACTIONS.MUSIC.PLAY_NOTIFICATION:
      return truncate(action.text);
    case ACTIONS.HTTP.REQUEST:
      if (!action.url) return null;
      return [`${action.method || 'GET'}`, truncate(action.url)];
    case ACTIONS.MQTT.SEND:
    case ACTIONS.ZIGBEE2MQTT.SEND: {
      const topic = truncate(action.topic) || null;
      if (!topic) return null;
      const msg = action.message ? truncate(action.message) : null;
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
    case ACTIONS.DEVICE.GET_VALUE: {
      const lbl = action.device_feature_label || action.device_feature || null;
      if (!lbl) return null;
      const sep = lbl.indexOf(' › ');
      return sep === -1 ? truncate(lbl) : [truncate(lbl.substring(0, sep)), truncate(lbl.substring(sep + 3))];
    }
    case ACTIONS.DEVICE.CHECK_VALUE: {
      const name = action.device_feature_label || action.device_feature || null;
      if (!name) return null;
      const OP = { '=': '=', '!=': '≠', '>': '>', '>=': '≥', '<': '<', '<=': '≤' };
      const op = OP[action.operator] || action.operator || null;
      let valueDisplay = action.value != null ? String(action.value) : null;
      const isBinary =
        action.device_feature_type === 'binary' || action.device_feature_category === 'presence-sensor';
      const isCover =
        action.device_feature_category === 'shutter' || action.device_feature_category === 'curtain';
      const isButton = action.device_feature_category === 'button';
      if (isBinary && action.value != null) {
        valueDisplay = action.value === 1 ? 'On' : 'Off';
      } else if (isCover && action.value != null) {
        const COVER = { 1: 'Ouvert', 0: 'Stop', '-1': 'Fermé' };
        const coverVal = COVER[String(action.value)];
        valueDisplay = coverVal !== undefined ? coverVal : String(action.value);
      } else if (isButton && action.value != null) {
        const BTN = {
          1: 'Clic', 2: 'Double clic', 3: 'Appui long↓', 4: 'Appui long↑',
          5: 'Maintien', 6: 'Appui long', 7: 'Activé', 8: 'Désactivé',
          18: 'Triple', 19: 'Quadruple', 20: 'Relâché', 21: 'Multiple',
          22: 'Secoué', 23: 'Lancé', 24: 'Réveil'
        };
        const btnVal = BTN[action.value];
        valueDisplay = btnVal !== undefined ? btnVal : String(action.value);
      }
      const cond = op && valueDisplay != null ? `${op} ${valueDisplay}` : null;
      return cond ? [name, cond] : name;
    }
    case ACTIONS.DEVICE.CHECK_MULTI_VALUE: {
      const name = action.device_feature_label || action.device_feature || null;
      if (!name) return null;
      const n = Array.isArray(action.values) ? action.values.length : 0;
      const count = n > 0 ? `${n} valeur${n > 1 ? 's' : ''}` : null;
      return count ? [name, count] : name;
    }
    case ACTIONS.DEVICE.SET_VALUE: {
      const name = action.device_feature_label || action.device_feature;
      if (!name) return null;
      if (action.evaluate_value) {
        const evalLabel = action.evaluate_value_label
          ? truncate(action.evaluate_value_label, 40)
          : truncate(action.evaluate_value, 40);
        return [name, `= ${evalLabel}`];
      }
      if (action.value != null) {
        const isBinary = action.device_feature_type === 'binary';
        const isCover =
          action.device_feature_category === 'shutter' || action.device_feature_category === 'curtain';
        let valueDisplay;
        if (isBinary) {
          valueDisplay = action.value === 1 ? 'On' : 'Off';
        } else if (isCover) {
          const COVER = { 1: 'Ouvert', 0: 'Stop', '-1': 'Fermé' };
          const coverVal = COVER[String(action.value)];
          valueDisplay = coverVal !== undefined ? coverVal : String(action.value);
        } else {
          valueDisplay = String(action.value);
        }
        return [name, `= ${valueDisplay}`];
      }
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
      const COMPARATOR_FR = {
        'is-exactly': 'est exactement',
        'contains': 'contient',
        'starts-with': 'commence par',
        'ends-with': 'se termine par',
        'has-any-name': 'n\'importe quel nom',
      };
      const cals = action.calendars_label
        || (action.calendars && action.calendars.length > 0
          ? `${action.calendars.length} calendrier${action.calendars.length > 1 ? 's' : ''}`
          : null);
      const line1 = cals ? `Calendrier ${truncate(cals, 28)}` : null;
      const comparatorFr = COMPARATOR_FR[action.calendar_event_name_comparator] || null;
      let line2 = null;
      if (action.calendar_event_name_comparator === 'has-any-name') {
        line2 = comparatorFr;
      } else if (comparatorFr && action.calendar_event_name) {
        line2 = `${comparatorFr} ${truncate(action.calendar_event_name, 20)}`;
      } else if (comparatorFr) {
        line2 = comparatorFr;
      }
      if (line1 && line2) return [line1, line2];
      return line1 || line2 || null;
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

// Retourne le nom de classe Feather Icons de l'action (préfixe "fe-").
export function getActionIcon(action) {
  return ACTION_ICONS[action.type] || 'fe-settings';
}

// Actions qui produisent un nœud de type CONDITION (orange) plutôt qu'ACTION (bleu).
// Séparé de isIfThenElse car tous les nœuds condition n'ont pas de branches then/else.
const CONDITION_ACTION_SET = new Set([
  ACTIONS.CONDITION.IF_THEN_ELSE,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.CONDITION.CHECK_TIME,
  ACTIONS.HOUSE.IS_EMPTY,
  ACTIONS.HOUSE.IS_NOT_EMPTY,
  ACTIONS.CALENDAR.IS_EVENT_RUNNING,
  ACTIONS.DEVICE.CHECK_VALUE,
  ACTIONS.DEVICE.CHECK_MULTI_VALUE,
]);

// Vrai si l'action doit être rendue comme un nœud condition (ConditionNode).
export function isConditionAction(action) {
  return action != null && CONDITION_ACTION_SET.has(action.type);
}

// Vrai uniquement pour IF_THEN_ELSE : ce nœud expose trois sorties (then/after/else)
// au lieu d'une seule, et ses branches sont développées latéralement dans le graphe.
export function isIfThenElse(action) {
  return action != null && action.type === ACTIONS.CONDITION.IF_THEN_ELSE;
}

// Vrai pour CALENDAR.IS_EVENT_RUNNING : la sortie et la couleur de l'arête dépendent
// de stop_scene_if_event_found (true → "Non"/rouge, false → "Oui"/vert).
export function isCalendarCondition(action) {
  return action != null && action.type === ACTIONS.CALENDAR.IS_EVENT_RUNNING;
}

// ── Helpers de construction d'arêtes ────────────────────────────────
// outerEdge : arête du flux principal (grise par défaut, verte pour les conditions simples).
// branchEdge : arête de branche then (verte #10b981) ou else (rouge #ef4444).
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

// branchEdge : arête colorée depuis un handle nommé (then → vert, else → rouge).
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

// Construit un objet nœud React Flow pour une action, qu'elle soit dans le flux
// principal ou dans une branche then/else. extraData est fusionné dans node.data
// (ex : groupIndex, actionIndex, isBranch).
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

/**
 * Convertit une scène Gladys en graphe React Flow { nodes, edges }.
 *
 * Mise en page automatique :
 *  - Ligne 0 (y=START_Y)       : déclencheurs, côte à côte espacés de H_SPACING.
 *  - Lignes suivantes           : groupes d'actions, centrés sur le même axe X.
 *  - Branches then/else         : développées latéralement (gauche / droite) sous
 *    leur nœud IF_THEN_ELSE, avec autant de rangées qu'il y a d'étapes.
 * Chaque nœud action reçoit node.data.path = "groupIdx.actionIdx" pour que
 * NodeConfigPanel puisse retrouver son chemin dans la structure JSON de la scène.
 */
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
      position: { x: START_X + idx * H_SPACING - HALF_W, y: START_Y },
      data: {
        trigger,
        triggerIndex: idx,
        label: getTriggerLabel(trigger),
        icon: getTriggerIcon(trigger),
      },
    });
  });

  // Pré-calcul de la coordonnée Y de chaque groupe d'actions.
  // Un groupe contenant un IF_THEN_ELSE réserve autant de rangées que le nombre
  // maximal d'étapes dans ses branches, afin que les nœuds de branche ne se
  // superposent jamais aux nœuds du flux principal.
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
      // Pour les groupes avec branches : V_BRANCH_STEP * maxDepth (hauteur des branches)
      // + V_SPACING (marge vers le groupe suivant), ce qui garde l'arête "Suite" courte.
      y += maxDepth === 0 ? V_SPACING : V_BRANCH_STEP * maxDepth + V_SPACING;
    });
  }

  // Axe horizontal partagé par tous les groupes du flux principal et leurs branches.
  // Calculé depuis la ligne des déclencheurs : un seul déclencheur reste centré
  // au-dessus du premier nœud ; plusieurs se répartissent symétriquement.
  const flowCenterX = triggers.length > 0
    ? START_X + (triggers.length - 1) * H_SPACING / 2
    : START_X;

  // IDs des nœuds de la rangée précédente (déclencheurs au départ) — utilisés
  // pour tracer les arêtes vers la rangée courante.
  let prevIds = triggers.map((_, idx) => `trigger-${idx}`);
  // Table nodeId → action pour retrouver si une source est IF_THEN_ELSE (handle 'after')
  // ou une condition simple (arête verte) au moment de créer les arêtes séquentielles.
  const actionById = {};

  actionsGroups.forEach((actionGroup, groupIdx) => {
    const currentIds = [];
    const rowY = groupY[groupIdx];
    // Origine X du groupe : centré sur flowCenterX quelle que soit la largeur du groupe,
    // de sorte que tous les groupes du flux principal partagent le même axe vertical.
    const groupStartX = flowCenterX - (actionGroup.length - 1) * H_SPACING / 2;

    actionGroup.forEach((action, actionIdx) => {
      const id = `action-${groupIdx}-${actionIdx}`;
      const condX = groupStartX + actionIdx * H_SPACING;
      actionById[id] = action;

      nodes.push(
        makeActionNode(id, action, { x: condX - HALF_W, y: rowY }, {
          groupIndex: groupIdx,
          actionIndex: actionIdx,
          path: `${groupIdx}.${actionIdx}`,
        })
      );

      // ── Nœuds de branche pour Si/Alors/Sinon ───────────────────
      if (isIfThenElse(action)) {
        // groupY a déjà réservé une rangée par étape de branche entre ce nœud et
        // le groupe suivant du flux principal : les nœuds de branche ne partagent
        // jamais un Y avec des nœuds du flux principal.

        // Branche "Oui" (then) — placée à GAUCHE de condX.
        // thenCenterX = centre idéal de l'étape 0. Le nœud le plus à droite de
        // l'étape 0 doit rester à gauche de (groupStartX - H_SPACING) pour ne pas
        // empiéter sur la colonne "Suite".
        const thenGroups = action.then || [];
        const thenCount0 = thenGroups.length > 0 ? thenGroups[0].length : 1;
        // Centre idéal pour la branche then (le nœud rightmost de step-0 s'arrête à groupStartX - H_SPACING).
        // Pour les étapes plus larges, le centre glisse à gauche pour que rien ne dépasse cette frontière.
        const thenCenterX = groupStartX - H_SPACING * (thenCount0 + 1) / 2;
        const thenMaxX = groupStartX - H_SPACING;
        let prevThenIds = null;
        thenGroups.forEach((thenGroup, stepIdx) => {
          const stepY = rowY + V_BRANCH_STEP * (1 + stepIdx);
          const count = thenGroup.length;
          // Clampé pour que le nœud le plus à droite ne franchisse pas la frontière "Suite"
          const stepCenterX = Math.min(thenCenterX, thenMaxX - (count - 1) * H_SPACING / 2);
          const stepIds = [];
          thenGroup.forEach((thenAction, aIdx) => {
            const thenId = `${id}-then-${stepIdx}-${aIdx}`;
            const thenX = stepCenterX + H_SPACING * (aIdx - (count - 1) / 2);
            nodes.push(makeActionNode(thenId, thenAction, { x: thenX - HALF_W, y: stepY }, {
              isBranch: true,
              path: `${groupIdx}.${actionIdx}.then.${stepIdx}.${aIdx}`,
            }));
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

        // Branche "Non" (else) — placée à DROITE de tous les nœuds frères du groupe.
        // elseStartX = premier X disponible à droite du nœud condition et de ses frères.
        const elseStartX = Math.max(condX + H_SPACING, groupStartX + actionGroup.length * H_SPACING);
        const elseGroups = action.else || [];
        const elseCount0 = elseGroups.length > 0 ? elseGroups[0].length : 1;
        // Centre idéal pour la branche else (le nœud leftmost de step-0 commence à elseStartX).
        // Pour les étapes plus larges, le centre glisse à droite pour que rien ne dépasse à gauche.
        const elseCenterX = elseStartX + H_SPACING * (elseCount0 - 1) / 2;
        let prevElseIds = null;
        elseGroups.forEach((elseGroup, stepIdx) => {
          const stepY = rowY + V_BRANCH_STEP * (1 + stepIdx);
          const count = elseGroup.length;
          // Clampé pour que le nœud le plus à gauche ne franchisse pas la frontière "Suite"
          const stepCenterX = Math.max(elseCenterX, elseStartX + (count - 1) * H_SPACING / 2);
          const stepIds = [];
          elseGroup.forEach((elseAction, aIdx) => {
            const elseId = `${id}-else-${stepIdx}-${aIdx}`;
            const elseX = stepCenterX + H_SPACING * (aIdx - (count - 1) / 2);
            nodes.push(makeActionNode(elseId, elseAction, { x: elseX - HALF_W, y: stepY }, {
              isBranch: true,
              path: `${groupIdx}.${actionIdx}.else.${stepIdx}.${aIdx}`,
            }));
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

    // Arêtes séquentielles entre groupes :
    //  - IF_THEN_ELSE → sort par le handle 'after' (continuation après les branches)
    //  - condition simple (CheckTime, OnlyContinueIf…) → arête verte
    //  - action ordinaire → arête grise
    prevIds.forEach(sourceId => {
      const srcAction = actionById[sourceId];
      const sh = isIfThenElse(srcAction) ? 'after' : undefined;
      const color = isIfThenElse(srcAction)
        ? '#94a3b8'
        : isCalendarCondition(srcAction)
          ? (srcAction.stop_scene_if_event_found === true ? '#ef4444' : '#10b981')
          : isConditionAction(srcAction)
            ? '#10b981'
            : '#94a3b8';
      currentIds.forEach(targetId => {
        edges.push(outerEdge(`e-${sourceId}-${targetId}`, sourceId, targetId, sh, color));
      });
    });

    prevIds = currentIds;
  });

  return { nodes, edges };
}
