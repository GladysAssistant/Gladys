import { useState } from 'preact/hooks';
import { ACTIONS, EVENTS } from '../../../../../../server/utils/constants';
import { NODE_TYPES } from './sceneToGraph';
import style from './canvasStyle.css';

const TRIGGER_ENTRIES = [
  { type: EVENTS.DEVICE.NEW_STATE, label: 'État d\'appareil', icon: 'fe-activity' },
  { type: EVENTS.TIME.CHANGED, label: 'Heure planifiée', icon: 'fe-watch' },
  { type: EVENTS.TIME.SUNRISE, label: 'Lever du soleil', icon: 'fe-sunrise' },
  { type: EVENTS.TIME.SUNSET, label: 'Coucher du soleil', icon: 'fe-sunset' },
  { type: EVENTS.USER_PRESENCE.BACK_HOME, label: 'Retour maison', icon: 'fe-home' },
  { type: EVENTS.USER_PRESENCE.LEFT_HOME, label: 'Départ maison', icon: 'fe-log-out' },
  { type: EVENTS.HOUSE.EMPTY, label: 'Maison vide', icon: 'fe-home' },
  { type: EVENTS.HOUSE.NO_LONGER_EMPTY, label: 'Maison occupée', icon: 'fe-home' },
  { type: EVENTS.AREA.USER_ENTERED, label: 'Entrée dans zone', icon: 'fe-compass' },
  { type: EVENTS.AREA.USER_LEFT, label: 'Sortie de zone', icon: 'fe-compass' },
  { type: EVENTS.CALENDAR.EVENT_IS_COMING, label: 'Événement calendrier', icon: 'fe-calendar' },
  { type: EVENTS.ALARM.ARM, label: 'Alarme armée', icon: 'fe-bell' },
  { type: EVENTS.ALARM.DISARM, label: 'Alarme désarmée', icon: 'fe-bell-off' },
  { type: EVENTS.SYSTEM.START, label: 'Démarrage Gladys', icon: 'fe-power' },
  { type: EVENTS.MQTT.RECEIVED, label: 'Message MQTT', icon: 'fe-hash' },
];

const ACTION_ENTRIES = [
  { type: ACTIONS.LIGHT.TURN_ON, label: 'Allumer lumière', icon: 'fe-toggle-right', group: 'Lumière' },
  { type: ACTIONS.LIGHT.TURN_OFF, label: 'Éteindre lumière', icon: 'fe-toggle-left', group: 'Lumière' },
  { type: ACTIONS.LIGHT.TOGGLE, label: 'Basculer lumière', icon: 'fe-shuffle', group: 'Lumière' },
  { type: ACTIONS.LIGHT.BLINK, label: 'Faire clignoter', icon: 'fe-sun', group: 'Lumière' },
  { type: ACTIONS.SWITCH.TURN_ON, label: 'Allumer switch', icon: 'fe-toggle-right', group: 'Switch' },
  { type: ACTIONS.SWITCH.TURN_OFF, label: 'Éteindre switch', icon: 'fe-toggle-left', group: 'Switch' },
  { type: ACTIONS.SWITCH.TOGGLE, label: 'Basculer switch', icon: 'fe-shuffle', group: 'Switch' },
  { type: ACTIONS.DEVICE.SET_VALUE, label: 'Modifier appareil', icon: 'fe-sliders', group: 'Appareil' },
  { type: ACTIONS.DEVICE.GET_VALUE, label: 'Lire état appareil', icon: 'fe-refresh-cw', group: 'Appareil' },
  { type: ACTIONS.TIME.DELAY, label: 'Attendre', icon: 'fe-clock', group: 'Temps' },
  { type: ACTIONS.SCENE.START, label: 'Démarrer scène', icon: 'fe-fast-forward', group: 'Scène' },
  { type: ACTIONS.MESSAGE.SEND, label: 'Envoyer message', icon: 'fe-message-square', group: 'Message' },
  { type: ACTIONS.MESSAGE.SEND_CAMERA, label: 'Envoyer image caméra', icon: 'fe-camera', group: 'Message' },
  { type: ACTIONS.SMS.SEND, label: 'Envoyer SMS', icon: 'fe-message-circle', group: 'Message' },
  { type: ACTIONS.HTTP.REQUEST, label: 'Requête HTTP', icon: 'fe-link', group: 'Réseau' },
  { type: ACTIONS.MQTT.SEND, label: 'Envoyer MQTT', icon: 'fe-send', group: 'Réseau' },
  { type: ACTIONS.ZIGBEE2MQTT.SEND, label: 'Envoyer Zigbee2MQTT', icon: 'fe-zap', group: 'Réseau' },
  { type: ACTIONS.AI.ASK, label: 'Demander à l\'IA', icon: 'fe-cpu', group: 'IA' },
  { type: ACTIONS.MUSIC.PLAY_NOTIFICATION, label: 'Notification sonore', icon: 'fe-music', group: 'Audio' },
  { type: ACTIONS.USER.SET_SEEN_AT_HOME, label: 'Marquer présent', icon: 'fe-home', group: 'Présence' },
  { type: ACTIONS.USER.SET_OUT_OF_HOME, label: 'Marquer absent', icon: 'fe-log-out', group: 'Présence' },
  { type: ACTIONS.USER.CHECK_PRESENCE, label: 'Vérifier présence', icon: 'fe-user-check', group: 'Présence' },
  { type: ACTIONS.ALARM.SET_ALARM_MODE, label: 'Définir mode alarme', icon: 'fe-bell', group: 'Alarme' },
  { type: ACTIONS.ALARM.CHECK_ALARM_MODE, label: 'Vérifier mode alarme', icon: 'fe-bell', group: 'Alarme' },
  { type: ACTIONS.CALENDAR.IS_EVENT_RUNNING, label: 'Événement en cours', icon: 'fe-calendar', group: 'Calendrier' },
  { type: ACTIONS.ECOWATT.CONDITION, label: 'Condition Ecowatt', icon: 'fe-zap', group: 'Énergie' },
  { type: ACTIONS.EDF_TEMPO.CONDITION, label: 'Condition EDF Tempo', icon: 'fe-zap', group: 'Énergie' },
];

const CONDITION_ENTRIES = [
  { type: ACTIONS.CONDITION.IF_THEN_ELSE, label: 'Si / Alors / Sinon', icon: 'fe-git-branch' },
  { type: ACTIONS.CONDITION.ONLY_CONTINUE_IF, label: 'Continuer si', icon: 'fe-filter' },
  { type: ACTIONS.CONDITION.CHECK_TIME, label: 'Vérifier l\'heure', icon: 'fe-watch' },
  { type: ACTIONS.HOUSE.IS_EMPTY, label: 'Vérifier maison vide', icon: 'fe-home' },
  { type: ACTIONS.HOUSE.IS_NOT_EMPTY, label: 'Vérifier maison occupée', icon: 'fe-home' },
];

const TABS = [
  { id: 'trigger', label: 'Déclencheurs', color: '#10b981' },
  { id: 'action', label: 'Actions', color: '#3b82f6' },
  { id: 'condition', label: 'Conditions', color: '#f59e0b' },
];

const NodeSelector = ({ onAddNode, onSelectorPointerDown, getDragMoved, onClose }) => {
  const [activeTab, setActiveTab] = useState('trigger');
  const [search, setSearch] = useState('');

  const filterEntries = entries =>
    search.trim()
      ? entries.filter(e => e.label.toLowerCase().includes(search.toLowerCase()))
      : entries;

  const renderEntry = (entry, nodeType) => {
    const nodeData =
      nodeType === NODE_TYPES.TRIGGER
        ? { nodeType, triggerType: entry.type, label: entry.label, icon: entry.icon }
        : { nodeType, actionType: entry.type, label: entry.label, icon: entry.icon };

    return (
      <button
        key={entry.type}
        class={style.selectorEntry}
        onPointerDown={e => {
          // Only left button
          if (e.button !== 0 && e.buttons !== 1) return;
          e.preventDefault();
          onSelectorPointerDown(nodeData, e.clientX, e.clientY);
        }}
        onClick={() => {
          // Suppress click if the user performed a real drag (moved > 4px)
          if (getDragMoved && getDragMoved()) return;
          onAddNode(
            nodeType === NODE_TYPES.TRIGGER
              ? { type: NODE_TYPES.TRIGGER, triggerType: entry.type }
              : { type: nodeType, actionType: entry.type }
          );
        }}
      >
        <i class={`fe fe-move ${style.selectorEntryDragHandle}`} />
        <i class={`fe ${entry.icon} ${style.selectorEntryIcon}`} />
        <span class={style.selectorEntryLabel}>{entry.label}</span>
        {entry.group && <span class={style.selectorEntryGroup}>{entry.group}</span>}
      </button>
    );
  };

  return (
    <div class={style.selectorPanel}>
      <div class={style.selectorHeader}>
        <span class={style.selectorTitle}>Ajouter un bloc</span>
        <button class={style.selectorClose} onClick={onClose}>
          <i class="fe fe-x" />
        </button>
      </div>

      <div class={style.selectorSearch}>
        <i class={`fe fe-search ${style.selectorSearchIcon}`} />
        <input
          type="text"
          class={style.selectorSearchInput}
          placeholder="Rechercher..."
          value={search}
          onInput={e => setSearch(e.target.value)}
        />
      </div>

      <div class={style.selectorTabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            class={`${style.selectorTab} ${activeTab === tab.id ? style.selectorTabActive : ''}`}
            style={activeTab === tab.id ? { borderColor: tab.color, color: tab.color } : {}}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div class={style.selectorList}>
        {activeTab === 'trigger' &&
          filterEntries(TRIGGER_ENTRIES).map(e => renderEntry(e, NODE_TYPES.TRIGGER))}
        {activeTab === 'action' &&
          filterEntries(ACTION_ENTRIES).map(e => renderEntry(e, NODE_TYPES.ACTION))}
        {activeTab === 'condition' &&
          filterEntries(CONDITION_ENTRIES).map(e => renderEntry(e, NODE_TYPES.CONDITION))}
      </div>
    </div>
  );
};

export default NodeSelector;
